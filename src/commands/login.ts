import inquirer from 'inquirer'
import { logger } from '../utils/logger'
import { createSpinner } from 'nanospinner'
import { config } from '../utils/config'

enum LOGIN_MODE {
  LOGIN = 'login',
  SSO = 'sso',
  TOKEN = 'token'
}

export const command: string = 'login'
export const desc: string = 'Login to Unleash'
export const aliases: string[] = ['setup']

export const handler = async () => {
  let { url } = await inquirer.prompt<{ url: string }>([
    {
      message: 'Unleash URL:',
      name: 'url'
    }
  ])

  const { mode } = await inquirer.prompt<{ mode: LOGIN_MODE }>([
    {
      message: 'Login using:',
      name: 'mode',
      type: 'list',
      choices: [
        {
          name: 'Unleash account (username / password)',
          short: 'Unleash account',
          value: LOGIN_MODE.LOGIN
        },
        { name: 'Single Sign-On', short: 'SSO', value: LOGIN_MODE.SSO },
        { name: 'API Token', short: 'Token', value: LOGIN_MODE.TOKEN }
      ],
      default: LOGIN_MODE.TOKEN
    }
  ])

  if (mode !== LOGIN_MODE.TOKEN) {
    logger.fatal('Not implemented yet.')
  }

  const { token } = await inquirer.prompt<{ token: string }>([
    {
      message: 'Unleash Token (personal access token is enough):',
      name: 'token',
      type: 'password',
      mask: '*'
    }
  ])

  await save({ url, token })
}

const save = async ({
  url,
  token
}: {
  url: string
  token: string
}) => {
  const spinner = createSpinner('Saving...').start()
  try {
    const inKeyring = config.save({ url, token })
    spinner.success({
      text: inKeyring
        ? 'Configuration saved. The token is stored in your system keyring.'
        : 'Configuration saved. Could not use the system keyring (is libsecret-tools installed and the keyring unlocked?), so the token was saved in plain text.'
    })
  } catch (error: any) {
    spinner.error({ text: error.message })
  }
}
