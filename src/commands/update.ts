import { Arguments, CommandBuilder } from 'yargs'
import { api } from '../utils/api'
import { run } from '../utils/cli'
import { featurePath } from '../utils/unleash'

type Options = {
  featureToggle: string
  project: string
  type?: string
  description?: string
  stale?: boolean
  impressionData?: boolean
}

export const command: string = 'update <feature-toggle>'
export const desc: string =
  'Update toggle metadata; only the given fields change. Prints JSON'

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' },
      type: { type: 'string', alias: 't' },
      description: { type: 'string', alias: 'd' },
      stale: { type: 'boolean' },
      'impression-data': { type: 'boolean' }
    })
    .positional('featureToggle', { type: 'string', demandOption: true })

export const handler = (argv: Arguments<Options>) =>
  run(async () => {
    const path = featurePath(argv.project, argv.featureToggle)
    // PUT replaces the metadata, so merge onto the current values.
    const current = await api.get<Record<string, any>>(path)
    const changes = {
      type: argv.type,
      description: argv.description,
      stale: argv.stale,
      impressionData: argv.impressionData
    }
    const body: Record<string, unknown> = {
      name: current.name,
      type: current.type,
      description: current.description,
      stale: current.stale,
      impressionData: current.impressionData
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) body[key] = value
    }
    return api.put(path, body)
  })
