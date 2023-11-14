export const track = (name: string, data?: Record<string, number | string>) => {
  // if (!umami) return console.error('umami is not defined')
  // if (import.meta.env.VITE_MODE === 'plugin') {
  //   // @ts-expect-error type correct
  //   return umami.track((params) => ({
  //     ...params,
  //     hostname: 'plugin',
  //     name,
  //     data,
  //   }))
  // }
  // return umami.track(name, data)
}
