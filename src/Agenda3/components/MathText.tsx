import katex from 'katex'
import 'katex/dist/katex.min.css'

const mathExpression = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\([\s\S]+?\\\))/g

const MathText = ({ children }: { children: string }) => {
  return (
    <>
      {children.split(mathExpression).map((part, index) => {
        const isDollarMath = part.startsWith('$') && part.endsWith('$')
        const isParenMath = part.startsWith('\\(') && part.endsWith('\\)')
        if (!isDollarMath && !isParenMath) return part

        const isDisplay = part.startsWith('$$')
        const expression =
          isDisplay || isDollarMath ? part.slice(isDisplay ? 2 : 1, isDisplay ? -2 : -1) : part.slice(2, -2)
        const html = katex.renderToString(expression, {
          displayMode: isDisplay,
          strict: 'ignore',
          throwOnError: false,
        })

        return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </>
  )
}

export default MathText
