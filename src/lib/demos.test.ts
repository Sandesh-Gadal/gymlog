import { describe, expect, it } from 'vitest'
import { demoFor, demoImages } from './demos'
import { BUILT_IN_EXERCISES } from './exercises'

describe('exercise demos', () => {
  const files = Object.keys(import.meta.glob('/public/demos/*/*.jpg'))
  const ids = BUILT_IN_EXERCISES.map((e) => e.id).filter((id) => demoFor(id))

  it('covers the preview exercises', () => {
    expect(ids).toEqual(expect.arrayContaining(['bench-press', 'squat']))
  })

  it('every demo has both images on disk and some steps', () => {
    for (const id of ids) {
      for (const src of demoImages(id, '/public/')) expect(files, src).toContain(src)
      expect(demoFor(id)!.steps.length).toBeGreaterThan(0)
    }
  })

  it('uses the base path', () => {
    expect(demoImages('squat', '/gymlog/')).toEqual(['/gymlog/demos/squat/0.jpg', '/gymlog/demos/squat/1.jpg'])
  })
})
