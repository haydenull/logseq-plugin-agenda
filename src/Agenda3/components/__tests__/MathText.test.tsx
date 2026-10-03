import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import MathText from '../MathText'

describe('MathText', () => {
  test('renders inline LaTeX while preserving surrounding title text', () => {
    const markup = renderToStaticMarkup(
      <MathText>{String.raw`Learn derivatives $\frac{\partial^2 C}{\partial \nu_j \partial \nu_k}$ today`}</MathText>,
    )

    expect(markup).toContain('Learn derivatives ')
    expect(markup).toContain('class="katex"')
    expect(markup).toContain(' today')
  })
})
