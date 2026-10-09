/**
 * Tiny Web Audio cue player for the hero scenes. Original synthesised tones — no audio files.
 * - Nothing is created until enable() is called from an explicit user click.
 * - One short tone per scene change; overlapping/rapid triggers are dropped.
 * - Suspends when the tab is hidden; disable() silences immediately.
 */
type Voice = { stop: () => void }

const MASTER = 0.05 // keep it quiet
const MIN_GAP = 0.32 // seconds between cues

export class HeroSound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voice: Voice | null = null
  private last = -1
  enabled = false

  private onVisibility = () => {
    if (!this.ctx) return
    if (document.hidden) this.ctx.suspend()
    else if (this.enabled) this.ctx.resume()
  }

  async enable() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return false
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = MASTER
      this.master.connect(this.ctx.destination)
      document.addEventListener('visibilitychange', this.onVisibility)
    }
    this.master!.gain.setValueAtTime(MASTER, this.ctx.currentTime)
    await this.ctx.resume()
    this.enabled = true
    return true
  }

  disable() {
    this.enabled = false
    this.voice?.stop()
    this.voice = null
    if (this.ctx && this.master) {
      this.master.gain.setValueAtTime(0, this.ctx.currentTime)
      this.ctx.suspend()
    }
  }

  destroy() {
    this.disable()
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.ctx?.close()
    this.ctx = null
  }

  /** Scene 0–3, each with its own timbre */
  play(scene: number) {
    const ctx = this.ctx
    if (!this.enabled || !ctx || !this.master || ctx.state !== 'running' || document.hidden) return
    const now = ctx.currentTime
    if (this.last >= 0 && now - this.last < MIN_GAP) return
    this.last = now
    this.voice?.stop()

    const out = ctx.createGain()
    out.connect(this.master)
    const nodes: OscillatorNode[] = []
    const env = (peak: number, attack: number, decay: number) => {
      out.gain.setValueAtTime(0.0001, now)
      out.gain.exponentialRampToValueAtTime(peak, now + attack)
      out.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay)
      return now + attack + decay + 0.05
    }
    const osc = (type: OscillatorType, freq: number, gain = 1, dest: AudioNode = out) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, now)
      g.gain.value = gain
      o.connect(g).connect(dest)
      nodes.push(o)
      return o
    }

    let end = now + 1
    if (scene === 0) {
      // soft glass bell: sine + quiet inharmonic partial
      osc('sine', 659.25)
      osc('sine', 659.25 * 2.76, 0.12)
      end = env(0.9, 0.012, 0.9)
    } else if (scene === 1) {
      // rising triangle pluck — "connecting the flow"
      const o = osc('triangle', 392)
      o.frequency.exponentialRampToValueAtTime(587.33, now + 0.18)
      end = env(0.8, 0.008, 0.55)
    } else if (scene === 2) {
      // warm filtered saw dyad — "craft"
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.setValueAtTime(1800, now)
      lp.frequency.exponentialRampToValueAtTime(500, now + 0.6)
      lp.connect(out)
      osc('sawtooth', 293.66, 0.5, lp)
      osc('sawtooth', 440, 0.35, lp)
      end = env(0.6, 0.03, 0.75)
    } else if (scene === 4) {
      osc('sine', 392, 0.6)
      osc('sine', 493.88, 0.45)
      osc('sine', 587.33, 0.35)
      end = env(0.7, 0.025, 0.85)
    } else {
      // shimmering detuned sines with gentle vibrato — "AI + human"
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = 6
      depth.gain.value = 4
      lfo.connect(depth)
      const a = osc('sine', 523.25)
      const b = osc('sine', 527.5, 0.7)
      osc('sine', 783.99, 0.25)
      depth.connect(a.frequency)
      depth.connect(b.frequency)
      nodes.push(lfo)
      end = env(0.7, 0.05, 1.0)
    }
    nodes.forEach((n) => {
      n.start(now)
      n.stop(end)
    })
    let stopped = false
    this.voice = {
      stop: () => {
        if (stopped) return
        stopped = true
        const t = ctx.currentTime
        out.gain.cancelScheduledValues(t)
        out.gain.setValueAtTime(out.gain.value, t)
        out.gain.linearRampToValueAtTime(0, t + 0.03)
        nodes.forEach((n) => {
          try {
            n.stop(t + 0.04)
          } catch {
            /* already stopped */
          }
        })
      },
    }
  }
}
