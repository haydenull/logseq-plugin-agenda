import { afterEach, describe, expect, test, vi } from 'vitest'

import { getAllProjects } from '../project'

describe('DB graph pages', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('uses DB page titles and names and orders favorites first', async () => {
    vi.stubGlobal('logseq', {
      App: {
        getCurrentGraphFavorites: vi.fn().mockResolvedValue([{ title: 'Favorite Page' }]),
      },
      Editor: {
        getAllPages: vi.fn().mockResolvedValue([
          { id: 1, uuid: 'favorite', name: 'favorite-page', title: 'Favorite Page' },
          { id: 2, uuid: 'regular', name: 'Regular Page' },
        ]),
      },
    })

    const projects = await getAllProjects()

    expect(projects.map((project) => project.originalName)).toEqual(['Favorite Page', 'Regular Page'])
    expect(projects[0].isFavorite).toBe(true)
  })
})
