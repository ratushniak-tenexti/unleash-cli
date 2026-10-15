import fs from 'fs'
import os from 'os'
import path from 'path'
import nconf from 'nconf'
import { logger } from './logger'
import {
  deleteSecret,
  getSecret,
  keyringAvailable,
  setSecret,
  SecretName
} from './secrets'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'unleash-cli')
fs.mkdirSync(CONFIG_DIR, { recursive: true })

nconf.argv().env().file({ file: path.join(CONFIG_DIR, 'config.json') })

// Precedence: env/argv > keyring > legacy plain-text value in config.json.
const secret = (name: SecretName, key: string) =>
  nconf.get(key) ?? getSecret(name)

// Stores in the keyring when possible. Otherwise falls back to config.json
// (plain text) and returns false so the caller can warn.
const store = (name: SecretName, key: string, value?: string) => {
  if (!value) {
    deleteSecret(name)
    nconf.clear(key)
    return true
  }
  if (keyringAvailable()) {
    setSecret(name, value)
    nconf.clear(key)
    return true
  }
  nconf.set(key, value)
  return false
}

export const config = {
  url: nconf.get('URL'),
  get token(): string | undefined {
    return secret('unleash-token', 'TOKEN')
  },
  get openAIToken(): string | undefined {
    return secret('openai-token', 'OPEN_AI_TOKEN')
  },
  isValid: () => !!config.url && !!config.token,
  // Returns true if every secret went to the keyring, false if any fell back
  // to plain text.
  save(input: { url: string; token: string; openAIToken?: string }) {
    nconf.set('URL', input.url + (input.url.endsWith('/') ? '' : '/'))
    const a = store('unleash-token', 'TOKEN', input.token)
    const b = store('openai-token', 'OPEN_AI_TOKEN', input.openAIToken)
    nconf.save((error: any) => {
      if (error) {
        logger.error(error)
      }
    })
    return a && b
  },
  saveOpenAIToken(token: string) {
    const ok = store('openai-token', 'OPEN_AI_TOKEN', token)
    nconf.save((error: any) => {
      if (error) {
        logger.error(error)
      }
    })
    return ok
  }
}
