import { createSpinner } from 'nanospinner'
import { config } from '../utils/config'

export const command: string = 'logout'
export const desc: string = 'Remove the saved URL and token (including the keyring entry)'

export const handler = () => {
  const spinner = createSpinner('Clearing configuration...').start()
  config.clear()
  spinner.success({ text: 'Logged out.' })
}
