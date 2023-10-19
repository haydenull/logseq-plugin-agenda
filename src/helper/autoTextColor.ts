const getTextColor = (bgColor: number[]) => {
  // 当color值大于128时,color值偏向255,即#ffffff,此时字体颜色应为#333333
  // 当color值小于128时,color值偏向0,即#000000,此时字体颜色应为#ffffff
  const isWhiteBg = 0.299 * bgColor[0] + 0.587 * bgColor[1] + 0.114 * bgColor[2] > 128
  return isWhiteBg ? '#333333' : '#ffffff'
}

/**
 * get text color base on background color
 * @param rbgColor rgba(11, 22, 33, 1)
 */
export const autoTextColor = (rbgColor: string) => {
  const [red, green, blue, alpha] = rbgColor.replace(/[rgba()]/g, '').split(',')
  if (rbgColor === 'rgb(149, 239, 181)') console.log('xxxxx', getTextColor([Number(red), Number(green), Number(blue)]))
  if (rbgColor === 'rgb(149, 239, 181)') console.log('yyyyy', [red, Number(green), Number(blue)])
  return getTextColor([Number(red), Number(green), Number(blue)])
}
