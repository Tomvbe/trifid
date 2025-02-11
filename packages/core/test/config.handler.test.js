import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, test } from '@jest/globals'

import handler from '../lib/config/handler.js'
import { fileCallback } from '../lib/resolvers.js'

describe('config handler', () => {
  test('should not throw when loading an empty configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/empty.json')),
    ).resolves.not.toThrow()
  })

  test('should not throw when loading an empty configuration', async () => {
    await expect(handler({})).resolves.not.toThrow()
  })

  test('should not throw when loading a configuration that extends an existing one', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler({
        extends: [`${currentDir}/support/empty.json`],
      }),
    ).resolves.not.toThrow()
  })

  test('should throw when loading a configuration that extends a non-existant one', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler({
        extends: [`${currentDir}/support/non-existant.json`],
      }),
    ).rejects.toThrow()
  })

  test('should not throw when loading a basic configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/basic.json')),
    ).resolves.not.toThrow()
  })

  test('should not throw when loading a basic YAML configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/basic.yaml')),
    ).resolves.not.toThrow()
  })

  test('should throw when trying to load a non-existant configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/non-existant.json')),
    ).rejects.toThrow()
  })

  test('should throw when trying to read an invalid configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/invalid.json')),
    ).rejects.toThrow()
  })

  test('should throw when trying to read an invalid JSON file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/invalid-json.json')),
    ).rejects.toThrow()
  })

  test('should support comments in JSON configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/basic-commented.json')),
    ).resolves.not.toThrow()
  })

  test('simple chain should work', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/chain/chain1.json')),
    ).resolves.not.toThrow()
  })

  test('check if expected values are here on extended config', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const config = await handler(
      fileCallback(currentDir)('./support/chain/chain1.json'),
    )
    expect(config.globals).toBeDefined()
    expect(config.globals.value3).toBeDefined()
    expect(config.globals.value3).toEqual('chain3')
    expect(config.globals.value2).toBeDefined()
    expect(config.globals.value2).toEqual('chain2')
    expect(config.globals.value1).toBeDefined()
    expect(config.globals.value1).toEqual('chain1')
    expect(config.globals.value).toBeDefined()
    expect(config.globals.value).toEqual('chain1')
  })

  test('simple check using the file resolver should work', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/chain-file/chain1.json')),
    ).resolves.not.toThrow()
  })

  test('check if expected values are here on extended config with file prefix', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const config = await handler(
      fileCallback(currentDir)('./support/chain-file/chain1.json'),
    )
    expect(config.globals).toBeDefined()
    expect(config.globals.value3).toBeDefined()
    expect(config.globals.value3).toEqual('chain3')
    expect(config.globals.value2).toBeDefined()
    expect(config.globals.value2).toEqual('chain2')
    expect(config.globals.value1).toBeDefined()
    expect(config.globals.value1).toEqual('chain1')
    expect(config.globals.value).toBeDefined()
    expect(config.globals.value).toEqual('chain1')
  })

  test('should throw in case of infinite loop', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(
      handler(fileCallback(currentDir)('./support/infinite-loop/chain1.json')),
    ).rejects.toThrow()
  })
})
