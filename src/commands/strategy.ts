import { Arguments, CommandBuilder } from 'yargs'
import { api } from '../utils/api'
import { readJson, run } from '../utils/cli'
import { envPath } from '../utils/unleash'

type Options = {
  action: string
  featureToggle: string
  strategyId?: string
  project: string
  environment: string
  file?: string
}

export const command: string =
  'strategy <action> <feature-toggle> [strategy-id]'
export const desc: string =
  'List, add, update or delete activation strategies in an environment. add/update take the strategy JSON (name, parameters, constraints, variants, segments, disabled) from --file or stdin. Prints JSON'

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' },
      environment: { type: 'string', alias: 'e', default: 'development' },
      file: { type: 'string', alias: 'f', describe: 'JSON file, or - for stdin' }
    })
    .positional('action', {
      choices: ['list', 'add', 'update', 'delete'],
      demandOption: true
    })
    .positional('featureToggle', { type: 'string', demandOption: true })
    .positional('strategyId', { type: 'string' })

export const handler = (argv: Arguments<Options>) =>
  run(async () => {
    const base = `${envPath(
      argv.project,
      argv.featureToggle,
      argv.environment
    )}/strategies`
    if (argv.action === 'list') return api.get(base)
    if (argv.action === 'add') return api.post(base, await readJson(argv.file))

    if (!argv.strategyId) {
      throw new Error(`strategy ${argv.action} requires a <strategy-id>`)
    }
    const url = `${base}/${encodeURIComponent(argv.strategyId)}`
    if (argv.action === 'delete') return api.delete(url)
    return api.put(url, await readJson(argv.file))
  })
