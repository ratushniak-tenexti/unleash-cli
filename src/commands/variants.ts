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

const examples = String.raw`Body for "set": a JSON array of ALL variants of the toggle in that environment.
  - weight is 0-1000 and the weights must sum to 1000 (1000 = 100%)
  - weightType: "variable" (default) shares what is left after "fix" variants
  - payload.value is always a STRING, even for type "json" (escape the JSON)
  - [] removes all variants; "set" overwrites, so run "get" first to change one

Example:
  echo '[{"name":"pool-settings","weight":1000,"weightType":"variable","stickiness":"default","payload":{"type":"json","value":"{\"maxContextsPerBrowser\":5}"}}]' \
    | unleash variants set my-flag -e development

"get" prints {"version":..., "variants":[...]}; "set" takes only the array.`

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' },
      environment: { type: 'string', alias: 'e', default: 'development' },
      file: { type: 'string', alias: 'f', describe: 'JSON file, or - for stdin' }
    })
    .positional('action', { choices: ['get', 'set'], demandOption: true })
    .positional('featureToggle', { type: 'string', demandOption: true })
    .wrap(null)
    .epilogue(examples)

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
