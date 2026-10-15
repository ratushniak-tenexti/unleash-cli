import { Arguments, CommandBuilder } from 'yargs'
import { api } from '../utils/api'
import { run } from '../utils/cli'
import { featurePath } from '../utils/unleash'

type Options = { featureToggle: string; project: string }

export const command: string = 'archive <feature-toggle>'
export const desc: string = 'Archive a feature toggle. Prints JSON'

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({ project: { type: 'string', alias: 'p', default: 'default' } })
    .positional('featureToggle', { type: 'string', demandOption: true })

export const handler = (argv: Arguments<Options>) =>
  run(() => api.delete(featurePath(argv.project, argv.featureToggle)))
