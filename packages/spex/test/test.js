import assert from 'assert'
import { describe, it } from 'mocha'
import request from 'supertest'
import express from 'express'
import trifidFactory from '../index.js'

const createTrifidConfig = (config) => {
  return {
    config,
    render: async (_templatePath, _templateOptions, _layoutOptions) => {
      return 'OK'
    },
  }
}

describe('trifid-plugin-spex', () => {
  describe('trifid factory', () => {
    it('should create a middleware with factory and default options', async () => {
      const trifid = createTrifidConfig({})
      const middleware = await trifidFactory(trifid)

      assert.strictEqual(typeof middleware, 'function')
    })
  })

  describe('middleware', () => {
    it('should redirect to a version with a trailing slash', async () => {
      const trifid = createTrifidConfig({
        endpointUrl: '/test',
      })
      const middleware = await trifidFactory(trifid)

      const app = express()
      app.use('/spex', middleware)

      await request(app).get('/spex').expect(302)
    })

    it('can execute', async () => {
      const trifid = createTrifidConfig({
        endpointUrl: '/test',
      })
      const middleware = await trifidFactory(trifid)

      const app = express()
      app.use('/spex', middleware)

      await request(app).get('/spex/').expect(200)
    })
  })

  describe('static assets', () => {
    it('should be able to provide the static JavaScript file', async () => {
      const trifid = createTrifidConfig({
        endpointUrl: '/test',
      })
      const middleware = await trifidFactory(trifid)

      const app = express()
      app.use('/spex', middleware)

      await request(app).get('/spex/static/spex.umd.min.js').expect(200)
    })

    it('should be able to provide the static CSS file', async () => {
      const trifid = createTrifidConfig({
        endpointUrl: '/test',
      })
      const middleware = await trifidFactory(trifid)

      const app = express()
      app.use('/spex', middleware)

      await request(app).get('/spex/static/spex.css').expect(200)
    })
  })
})
