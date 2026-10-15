import { createSpinner } from 'nanospinner'
import { api, ROUTES } from '../utils/api'
import { FeatureToggleListItem } from '../utils/interfaces'
import { logger } from '../utils/logger'
import { jqActive, run } from '../utils/cli'
import { Arguments, CommandBuilder } from 'yargs'

type Options = {
  project?: string
}

export const command: string = 'list'
export const desc: string = 'List feature toggles'
export const aliases: string[] = ['ls']

export const examples = String.raw`Without --jq a table is printed. With --jq the JSON {"features":[...]} (every field of every flag) is filtered by jq, so select only what you need:
  unleash list --jq '.features[].name'
  unleash list --jq '.features[] | select(.stale) | .name'
  unleash list --jq '.features[] | {name, type, lastSeenAt}'
  unleash list --jq '.features[] | select(.name | test("camoufox")) | .name'
  unleash list --jq '.features | map({name, type}) | sort_by(.name)'
  unleash list --jq '.features[] | select(.environments[]? | select(.name=="development" and .enabled)) | .name'

Use "unleash toggle <flag> --jq ..." for the detail of one flag.`

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs.options({
    project: { type: 'string', alias: 'p', default: 'default' }
  }).wrap(null).epilogue(examples)

export const handler = async (argv: Arguments<Options>) => {
  const { project } = argv
  if (jqActive()) {
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
