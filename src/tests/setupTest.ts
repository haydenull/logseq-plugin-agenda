// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest'

// export const restHandler = [
// http.post('/api', async (req, res, ctx) => {
//   const { method, args } = await req.json()
//   let data
//   switch (method) {
//     case 'logseq.DB.datascriptQuery':
//       // data =
//       break
//     case 'logseq.DB.onChanged':
//       data = { error: 'MethodNotExist: on_changed' }
//       break
//     default:
//       break
//   }
//   return res(ctx.status(200), ctx.json(data))
// }),
// ]
// const server = setupServer(...restHandler)

// beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// afterAll(() => server.close())
// afterEach(() => server.resetHandlers())
