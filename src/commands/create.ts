import { Arguments, CommandBuilder } from 'yargs'
import { api } from '../utils/api'
import { run } from '../utils/cli'
import { projectPath } from '../utils/unleash'

type Options = {
  featureToggle: string
  project: string
  type: string
  description: string
  impressionData: boolean
}

export const command: string = 'create <feature-toggle>'
export const desc: string =
  'Create a feature toggle (disabled, no strategies). Prints JSON'

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' },
      type: {
        type: 'string',
        alias: 't',
        default: 'release',
        describe: 'release, experiment, operational, kill-switch, permission'
      },
      description: { type: 'string', alias: 'd', default: '' },
      'impression-data': { type: 'boolean', default: false }
    })
    .positional('featureToggle', { type: 'string', demandOption: true })

export const handler = (argv: Arguments<Options>) =>
  run(() =>
    api.post(`${projectPath(argv.project)}/features`, {
      name: argv.featureToggle,
      type: argv.type,
      description: argv.description,
      impressionData: argv.impressionData
    })
  )
