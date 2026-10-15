import { createSpinner } from 'nanospinner'
import { api, ROUTES } from '../utils/api'
import { FeatureToggleListItem } from '../utils/interfaces'
import { logger } from '../utils/logger'
import { run } from '../utils/cli'
import { Arguments, CommandBuilder } from 'yargs'

type Options = {
  project?: string
  json?: boolean
}

export const command: string = 'list'
export const desc: string = 'List feature toggles'
export const aliases: string[] = ['ls']

export const examples = String.raw`With --json the output is {"features":[...]} (large: every field of every flag), so filter it with jq:
  unleash list --json | jq -r '.features[].name'
  unleash list --json | jq -r '.features[] | select(.stale) | .name'
  unleash list --json | jq '.features[] | {name, type, lastSeenAt}'
  unleash list --json | jq -r '.features[] | select(.name | test("camoufox")) | .name'
  unleash list --json | jq '.features | map({name, type}) | sort_by(.name)'
  unleash list --json | jq -r '.features[] | select(.environments[]? | select(.name=="development" and .enabled)) | .name'

Use "unleash toggle <flag> --json" for the full detail of one flag.`

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs.options({
    project: { type: 'string', alias: 'p', default: 'default' },
    json: { type: 'boolean', default: false }
  }).wrap(null).epilogue(examples)

export const handler = async (argv: Arguments<Options>) => {
  const { project, json } = argv
  if (json) {
    return run(() => api.get(`${ROUTES.API_ADMIN}/projects/${project}/features`))
  }
  const spinner = createSpinner('Loading feature toggles...').start()
  try {
    const featureTogglesData = await api.get<{
      features: FeatureToggleListItem[]
    }>(`api/admin/projects/${project}/features`)
    spinner.success({ text: 'Feature toggles loaded successfully.' })
    logger.featureTogglesTable(featureTogglesData.features)
  } catch (error: any) {
    spinner.error({ text: error.message })
    process.exitCode = 1
  }
}
