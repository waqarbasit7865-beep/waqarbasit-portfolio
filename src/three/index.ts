/** Lazy-loaded 3D entry: everything that imports three.js lives behind this module. */
import { getStage } from './engine'
import { HeroWorld, type HeroOptions, type Region } from './hero/world'
import { ProcessView } from './process'
import { logosReady } from './hero/tools'
import { isLowPower } from './support'

export type { Region }
export { HeroWorld, ProcessView, logosReady }

export function stage() {
  return getStage(isLowPower())
}

export function createHero(o: Omit<HeroOptions, 'env' | 'quality'>) {
  const st = stage()
  return new HeroWorld({ ...o, env: st.envMap, quality: st.quality })
}

export function createProcess(still = false, initial = 0) {
  const st = stage()
  return new ProcessView(st.envMap, st.quality, still, initial)
}
