// @ts-check
import fs from 'fs/promises'
import { dirname } from 'path'
import merge from 'lodash/merge.js'
import JSON5 from 'json5'
import { parse } from 'yaml'
import cloneDeep from 'lodash/cloneDeep.js'
import { cwdCallback } from '../resolvers.js'
import parser from './parser.js'
import {
  extendsResolver,
  globalsResolver,
  middlewaresResolver,
  serverResolver,
  templateResolver,
} from './resolvers.js'
import { defaultPort, maxDepth } from './default.js'

const resolveConfig = async (
  rawConfig,
  fileFullPath = undefined,
  depth = 0,
) => {
  if (depth >= maxDepth) {
    throw new Error(
      'reached max configuration depth, maybe you went in an infinite loop. Please check the extends values from your configuration file recursively',
    )
  }

  if (fileFullPath === undefined) {
    fileFullPath = process.cwd()
  }

  const config = parser(rawConfig)
  addDefaultFields(config)

  const context = dirname(fileFullPath)

  // fetch all configuration files from which this one is extending
  let configs = []
  if (Array.isArray(config.extends) && config.extends.length > 0) {
    config.extends = extendsResolver(config.extends, context)
    configs = await Promise.all(
      config.extends.map((configPath) =>
        resolveConfigFile(configPath, depth + 1),
      ),
    )
  }

  // merge all fields
  const middlewares = {}
  configs.forEach((c) => {
    // merge template, globals and server parts
    config.globals = merge({}, c.globals, config.globals)
    config.server = merge({}, c.server, config.server)
    config.template = merge({}, c.template, config.template)

    // merge middlewares
    Object.keys(c.middlewares).forEach((m) => {
      middlewares[m] = c.middlewares[m]
    })
  })
  Object.keys(config.middlewares).forEach((m) => {
    middlewares[m] = config.middlewares[m]
  })

  // apply all resolvers
  config.middlewares = middlewaresResolver(middlewares, context)
  config.globals = globalsResolver(config.globals, context)
  config.server = serverResolver(config.server, context)
  config.template = templateResolver(config.template, context)

  // we don't need the extends field anymore
  delete config.extends

  return config
}

const resolveConfigFile = async (filePath, depth = 0) => {
  // read config file
  const fileFullPath = cwdCallback(filePath)
  const fileContent = await fs.readFile(fileFullPath, 'utf-8')

  let parsed

  const fileExtension = `${fileFullPath.split('.').pop()}`.toLocaleLowerCase()
  if (['yaml', 'yml'].includes(fileExtension)) {
    parsed = parse(`${fileContent}`)
  } else {
    parsed = JSON5.parse(fileContent)
  }

  return await resolveConfig(parsed, fileFullPath, depth)
}

/**
 * Add default fields for a configuration.
 * Warning: this function mutates the config object.
 *
 * @param {import('../../types/index.js').TrifidConfig} config Trifid configuration.
 * @return {void}
 */
const addDefaultFields = (config) => {
  if (!config.server) {
    config.server = {
      listener: {},
    }
  }

  if (!config.globals) {
    config.globals = {}
  }

  if (!config.middlewares) {
    config.middlewares = {}
  }
}

/**
 * Add the default port for the server configuration.
 * Warning: this function mutates the config object.
 *
 * @param {import('../../types/index.js').TrifidConfig} config Trifid configuration.
 * @return {void}
 */
const addDefaultPort = (config) => {
  if (!config.server.listener) {
    config.server.listener = {}
  }
  if (config.server.listener.port === undefined) {
    config.server.listener.port = defaultPort
  }
}

/**
 * Add some default Express settings for the server configuration.
 * Warning: this function mutates the config object.
 *
 * @param {import('../../types/index.js').TrifidConfig} config Trifid configuration.
 * @return {void}
 */
const addDefaultExpressSettings = (config) => {
  if (!config.server.express) {
    config.server.express = {}
  }

  if (!Object.hasOwnProperty.call(config.server.express, 'trust proxy')) {
    config.server.express['trust proxy'] = 'loopback'
  }
}

/**
 * Expand configuration and add default fields.
 *
 * @param {string | import('../../types/index.js').TrifidConfigWithExtends} configFile
 * @returns {Promise<import('../../types/index.js').TrifidConfig>}
 */
const handler = async (configFile) => {
  let config = {}
  if (typeof configFile === 'string') {
    config = await resolveConfigFile(configFile)
  } else {
    config = await resolveConfig(cloneDeep(configFile))
  }
  addDefaultFields(config)
  addDefaultPort(config)
  addDefaultExpressSettings(config)

  return config
}

export default handler
