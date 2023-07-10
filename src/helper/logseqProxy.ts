import settings from '@/mock/settings.json'

const fetchLogseqApi = async (method: string, args?: any[]) => {
  const res = await fetch(`${import.meta.env.VITE_LOGSEQ_API_SERVER}/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_LOGSEQ_API_TOKEN}`,
    },
    body: JSON.stringify({
      method,
      args,
    }),
  })
  if (res.headers.get('Content-Type')?.includes('application/json')) {
    return await res.json()
  }
  return res.text()
}

const LOGSEQ_METHODS_OBJECT = ['App', 'Editor', 'DB', 'Git', 'UI', 'Assets', 'FileStorage'] as const
const proxyLogseqMethodsObject = (key: (typeof LOGSEQ_METHODS_OBJECT)[number]) => {
  const proxy = new Proxy(
    {},
    {
      get(target, propKey) {
        return async (...args: any[]) => {
          const method = `logseq.${key}.${propKey.toString()}`
          console.warn('=== Proxy call to logseq: ', method)
          const data = await fetchLogseqApi(method, args)

          if (data?.error) {
            console.error(`=== Proxy ${method} error: `, data.error)
          }

          return data
        }
      },
    }
  )
  // @ts-ignore
  window.logseq[key] = proxy
}
export const proxyLogseq = () => {
  // @ts-ignore
  // window.logseqBack = window.logseq;
  // @ts-ignore
  window.logseq = {}
  LOGSEQ_METHODS_OBJECT.forEach(proxyLogseqMethodsObject)
  window.logseq.hideMainUI = () => alert('Proxy call to logseq.hideMainUI()')
  logseq.settings = settings
}
