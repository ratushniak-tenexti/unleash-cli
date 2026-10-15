import { createSpinner } from 'nanospinner'
import { Arguments, CommandBuilder } from 'yargs'
import { api, ROUTES } from '../utils/api'
import { FeatureToggle } from '../utils/interfaces'
import { logger } from '../utils/logger'
import { jqActive, run } from '../utils/cli'

type Options = {
  featureToggle: string
  project?: string
}

export const command: string = 'toggle <feature-toggle>'
export const desc: string = 'Shows feature toggle information'
export const aliases: string[] = ['t']

export const examples = String.raw`Without --jq a table is printed. With --jq the full flag (environments, strategies, variants) is filtered by jq:
  unleash toggle my-flag --jq '.environments[] | {name, enabled}'
  unleash toggle my-flag --jq '.environments[] | select(.name=="development") | .strategies'
  unleash toggle my-flag --jq '.environments[].strategies[]? | .id'
  unleash toggle my-flag --jq '.environments[] | select(.name=="development") | .variants'`

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs
    .options({
      project: { type: 'string', alias: 'p', default: 'default' }
    })
    .positional('featureToggle', { type: 'string', demandOption: true })
    .wrap(null)
    .epilogue(examples)

export const handler = async (argv: Arguments<Options>) => {
  const { featureToggle, project } = argv
  if (jqActive()) {
    return run(() =>
      api.get(`${ROUTES.API_ADMIN}/projects/${project}/features/${featureToggle}`)
    )
  }

  const spinner = createSpinner(`Loading ${featureToggle}...`).start()
  try {
    const featureToggleData = await api.get<FeatureToggle>(
      `${ROUTES.API_ADMIN}/projects/${project}/features/${featureToggle}`
    )
    spinner.success({ text: `${featureToggle} loaded successfully.` })
    logger.featureToggle(featureToggleData)
  } catch (error: any) {
    spinner.error({ text: error.message })
    process.exitCode = 1
  }
}
