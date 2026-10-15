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

export const builder: CommandBuilder<Options, Options> = yargs =>
  yargs.options({
    project: { type: 'string', alias: 'p', default: 'default' },
    json: { type: 'boolean', default: false }
  })

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
