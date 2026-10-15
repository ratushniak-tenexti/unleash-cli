import fs from 'fs'
import os from 'os'
import path from 'path'
import nconf from 'nconf'
import { logger } from './logger'
import {
  deleteSecret,
  getSecret,
  keyringAvailable,
  setSecret
} from './secrets'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'unleash-cli')
fs.mkdirSync(CONFIG_DIR, { recursive: true })

nconf.env().file({ file: path.join(CONFIG_DIR, 'config.json') })

export const config = {
  url: nconf.get('URL'),
  // Precedence: env > keyring > legacy plain-text value in config.json.
  get token(): string | undefined {
    return nconf.get('TOKEN') ?? getSecret('unleash-token')
  },
  isValid: () => !!config.url && !!config.token,
  // Stores the token in the keyring when possible; otherwise falls back to
  // config.json (plain text). Returns whether the keyring was used.
  save(input: { url: string; token: string }) {
    nconf.set('URL', input.url + (input.url.endsWith('/') ? '' : '/'))
    let inKeyring = false
    if (keyringAvailable()) {
      try {
        setSecret('unleash-token', input.token)
        inKeyring = true
      } catch {
        // locked or unreachable keyring: fall through to plain text
      }
    }
    if (inKeyring) {
      nconf.clear('TOKEN')
    } else {
      nconf.set('TOKEN', input.token)
    }
    nconf.save((error: any) => {
      if (error) {
        logger.error(error)
      }
    })
    return inKeyring
  },
  clear() {
    deleteSecret('unleash-token')
    nconf.clear('URL')
    nconf.clear('TOKEN')
    nconf.save((error: any) => {
      if (error) {
        logger.error(error)
      }
    })
  }
}
