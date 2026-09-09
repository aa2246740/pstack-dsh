import assert from 'node:assert/strict'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { describe, it, mock } from 'node:test'
import type { Context } from '@deepseek-ai/cordis'
import { SETTINGS_SNAPSHOT_PATH } from '../src/ids.ts'
import { registerPstackSettingsRoutes } from '../src/settings-routes.ts'
import type { CatalogHost } from '../src/catalog.ts'

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

describe('settings route authentication', () => {
  it('returns Connection 401/403 without reading or writing settings', async () => {
    for (const rejection of [401, 403] as const) {
      let handler: Handler | undefined
      const requestRejection = mock.fn(() => rejection)
      const ctx = {
        connection: { requestRejection },
        webServer: {
          register: (route: { handler: Handler }) => {
            handler = route.handler
            return () => {}
          },
        },
        effect: (factory: () => () => void) => { factory() },
      } as unknown as Context
      const host = new Proxy({}, {
        get() { throw new Error('settings host must not be touched') },
      }) as CatalogHost
      registerPstackSettingsRoutes(ctx, host)

      const socket = new Socket()
      const req = new IncomingMessage(socket)
      for (const method of ['GET', 'POST']) {
        req.method = method
        req.url = SETTINGS_SNAPSHOT_PATH
        req.headers = { host: '127.0.0.1:43127' }
        const res = new ServerResponse(req)
        let body = ''
        mock.method(res, 'writeHead', (status: number) => { res.statusCode = status; return res })
        mock.method(res, 'end', (chunk?: unknown) => { body = String(chunk ?? ''); return res })
        await handler?.(req, res)

        assert.equal(res.statusCode, rejection)
        assert.deepEqual(JSON.parse(body), { error: rejection === 401 ? 'unauthorized' : 'forbidden' })
      }
      socket.destroy()
      assert.equal(requestRejection.mock.callCount(), 2)
    }
  })
})
