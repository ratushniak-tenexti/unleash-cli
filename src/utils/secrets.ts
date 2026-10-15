import { execFileSync } from 'child_process'

const SERVICE = 'unleash-cli'

export type SecretName = 'unleash-token'

const run = (cmd: string, args: string[], input?: string) =>
  execFileSync(cmd, args, {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore']
  })

// Linux: libsecret (GNOME Keyring, KWallet via Secret Service). The secret is
// passed over stdin so it never shows up in `ps`.
// macOS: Keychain. `security` only accepts the password as an argument.
// Other platforms: unsupported, callers fall back to config.json.
export const keyringAvailable = (): boolean => {
  try {
    if (process.platform === 'linux') {
      run('secret-tool', ['--version'])
      return true
    }
    if (process.platform === 'darwin') return true
  } catch {
    // not installed
  }
  return false
}

export const getSecret = (name: SecretName): string | undefined => {
  try {
    const out =
      process.platform === 'linux'
        ? run('secret-tool', ['lookup', 'service', SERVICE, 'account', name])
        : process.platform === 'darwin'
        ? run('security', ['find-generic-password', '-s', SERVICE, '-a', name, '-w'])
        : ''
    return out.replace(/\r?\n$/, '') || undefined
  } catch {
    return undefined
  }
}

export const setSecret = (name: SecretName, value: string) => {
  if (process.platform === 'linux') {
    run(
      'secret-tool',
      ['store', '--label', `${SERVICE} ${name}`, 'service', SERVICE, 'account', name],
      value
    )
  } else if (process.platform === 'darwin') {
    run('security', ['add-generic-password', '-U', '-s', SERVICE, '-a', name, '-w', value])
  } else {
    throw new Error('No keyring support on this platform')
  }
}

export const deleteSecret = (name: SecretName) => {
  try {
    if (process.platform === 'linux') {
      run('secret-tool', ['clear', 'service', SERVICE, 'account', name])
    } else if (process.platform === 'darwin') {
      run('security', ['delete-generic-password', '-s', SERVICE, '-a', name])
    }
  } catch {
    // nothing stored
  }
}
