export const uploadIcsHttp = async ({ repo, token, file }: { repo: string; token: string; file: string }) => {
  return fetch(`https://agenda-ics.haydenhayden.com`, {
    method: 'POST',
    body: JSON.stringify({
      repo,
      token,
      file,
    }),
  })
}
