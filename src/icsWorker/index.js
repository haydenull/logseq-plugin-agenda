const USER_AGENT = 'Agenda ICS Cloudflare Worker'
const allowedOrigins = [
  'http://localhost:5173',
  'http://test.haydenhayden.com:5173',
  'https://agenda.haydenhayden.com',
  null,
]

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const rawOrigin = request.headers.get('Origin')
  console.log('=== rawOrigin', rawOrigin)
  if (!allowedOrigins.includes(rawOrigin)) {
    return genCorsResponse(rawOrigin, `Forbidden Origin ${request.headers.get('Origin')}`, { status: 403 })
  }
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const queryParams = url.searchParams
    const repoName = queryParams.get('repo')
    const token = queryParams.get('token')

    if (!repoName || !token) {
      return new Response('Missing required parameters', { status: 400 })
    }

    const apiUrl = `https://api.github.com/repos/${repoName}/contents/agenda.ics`

    const headers = {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    }

    const response = await fetch(apiUrl, {
      headers,
    })

    if (response.ok) {
      const fileData = await response.json()
      const fileContent = atob(fileData.content)
      return new Response(decodeURIComponent(escape(fileContent)))
    } else {
      return new Response('Failed to retrieve file content', { status: response.status })
    }
  } else if (request.method === 'POST') {
    try {
      console.log('POST')
      const body = await request.json()

      const repoName = body.repo
      const token = body.token
      const fileContent = body.file

      if (!repoName || !token || !fileContent) {
        return new Response('Missing required parameters', { status: 400 })
      }

      const apiUrl = `https://api.github.com/repos/${repoName}/contents/agenda.ics`

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      }

      const existingFileResponse = await fetch(apiUrl, {
        headers,
      })

      const existingFileData = await existingFileResponse.json()
      console.log('=== existingFileData', existingFileData)

      const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      })

      const payload = {
        message: `[Agenda]: update agenda.ics ${timestamp}`,
        content: btoa(unescape(encodeURIComponent(fileContent))),
        encoding: 'utf-8',
      }

      if (existingFileData.sha) {
        payload.sha = existingFileData.sha
      }

      console.log('apiUrl', apiUrl)
      const fileResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      })

      console.log('fileResponse', JSON.stringify(fileResponse))
      console.log('fileResponse.ok', fileResponse.ok)
      console.log('fileResponse.status', fileResponse.status)
      // console.log('fileResponse json', await fileResponse.json())

      return fileResponse.ok
        ? genCorsResponse(
            rawOrigin,
            JSON.stringify({
              message: 'File upload successful',
            }),
          )
        : genCorsResponse(
            rawOrigin,
            JSON.stringify({
              message: (await fileResponse.json()).message,
            }),
            { status: fileResponse.status },
          )
    } catch (error) {
      console.log('POST exec error', JSON.stringify(error))
      return genCorsResponse(
        rawOrigin,
        JSON.stringify({
          message: error?.message || 'Unknown error',
        }),
        { status: 500 },
      )
    }
  } else {
    return genCorsResponse(rawOrigin, 'Unsupported request method', { status: 405 })
  }
}

function genCorsResponse(origin, body, init) {
  const response = new Response(body, init)
  response.headers.set('Access-Control-Allow-Origin', origin || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.append('Access-Control-Allow-Headers', 'Content-Type')
  return response
}
