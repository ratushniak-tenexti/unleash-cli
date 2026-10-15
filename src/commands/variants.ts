import { Arguments, CommandBuilder } from 'yargs'
import { api } from '../utils/api'
import { readJson, run } from '../utils/cli'
import { envPath } from '../utils/unleash'

type Options = {
  action: string
  featureToggle: string
  project: string
  environment: string
  file?: string
}

export const command: string = 'variants <action> <feature-toggle>'
export const desc: string =
  'Get or set the variants of a toggle in an environment. `set` replaces ALL variants with a JSON array from --file or stdin (weights sum to 1000; [] removes them). Prints JSON'

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' },
      environment: { type: 'string', alias: 'e', default: 'development' },
      file: { type: 'string', alias: 'f', describe: 'JSON file, or - for stdin' }
    })
    .positional('action', { choices: ['get', 'set'], demandOption: true })
    .positional('featureToggle', { type: 'string', demandOption: true })

export const handler = (argv: Arguments<Options>) =>
  run(async () => {
    const url = `${envPath(
      argv.project,
      argv.featureToggle,
      argv.environment
    )}/variants`
    if (argv.action === 'get') return api.get(url)
    const variants = await readJson(argv.file)
    if (!Array.isArray(variants)) {
      throw new Error('Variants must be a JSON array')
    }
    return api.put(url, variants)
  })
