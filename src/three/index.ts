/** Lazy-loaded 3D entry: everything that imports three.js lives behind this module. */
import { getStage } from './engine'
import { HeroWorld, type HeroOptions, type Region } from './hero/world'
import { Sculpture } from './sculpture'
import { isLowPower } from './support'

export type { Region }
export { HeroWorld, Sculpture }

export function stage() {
  return getStage(isLowPower())
}

export function createHero(o: Omit<HeroOptions, 'env' | 'quality'>) {
  const st = stage()
  return new HeroWorld({ ...o, env: st.envMap, quality: st.quality })
}

export function createSculpture(still = false) {
  const st = stage()
  return new Sculpture(st.envMap, st.quality, still)
}
