// @ts-check

import { URL } from 'url'
import absoluteUrl from 'absolute-url'

/**
 * Replacement for `url.format` which is deprecated.
 *
 * @param {URL} urlObject The URL object.
 * @returns {string} URL as a string.
 */
const urlFrom = (urlObject) => urlObject.toString()

/**
 * Remove the searchParams part of a URL.
 *
 * @param {string} originalUrl Original URL.
 * @returns {string} The URL without the searchParams part.
 */
const removeSearchParams = (originalUrl) => {
  const url = new URL(originalUrl)
  url.search = ''
  url.searchParams.forEach((_value, key) => url.searchParams.delete(key))
  return urlFrom(url)
}

/** @type {import('../types/index.d.ts').TrifidMiddleware} */
const factory = (trifid) => {
  const { config, logger } = trifid
  const { datasetBaseUrl } = config

  // check if `datasetBaseUrl` is a valid URL if present
  if (datasetBaseUrl) {
    try {
      new URL(datasetBaseUrl) // eslint-disable-line no-new
    } catch (_e) {
      throw new Error(
        `The current value you have for 'datasetBaseUrl' is '${datasetBaseUrl}', which is not a valid URL.`,
      )
    }
  }

  return (req, res, next) => {
    absoluteUrl.attach(req)
    const url = req.absoluteUrl()
    req.iri = decodeURI(removeSearchParams(url))

    // set current path, so that middlewares can access it
    res.locals.currentPath = req.path

    // update `req.iri` if a value for `datasetBaseUrl` is provided
    if (datasetBaseUrl) {
      const absoluteBaseUrl = new URL('/', url)
      const currentBaseUrl = absoluteBaseUrl.toString()
      req.iri = req.iri.replace(currentBaseUrl, datasetBaseUrl)
      logger.debug(`value for req.iri: ${req.iri} (rewritten)`)
      return next()
    }

    logger.debug(`value for req.iri: ${req.iri}`)
    return next()
  }
}

export default factory
