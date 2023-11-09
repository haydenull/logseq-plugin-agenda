export const uploadIcsHttp = async ({ repo, token, file }: { repo: string; token: string; file: string }) => {
  return new Promise((resolve, reject) => {
    fetch(`https://agenda-ics.haydenhayden.com`, {
      method: 'POST',
      body: JSON.stringify({
        repo,
        token,
        file,
      }),
    }).then(async (response) => {
      const data = (await response.json()) as { message: string }
      if (!response.ok) {
        reject(data)
      }
      resolve(data)
    })
  })
}
