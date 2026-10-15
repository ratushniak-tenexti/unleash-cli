import chalk from 'chalk'
import Table from 'cli-table3'
import { config } from './config'
import { FeatureToggle, FeatureToggleListItem } from './interfaces'

const info = (message: string, label = 'Info') =>
  console.log(`${chalk.cyan(`${chalk.underline(label)}:`)} ${message}`)

const error = (message: string, label = 'Error') =>
  console.error(`${chalk.red(`${chalk.underline(label)}:`)} ${message}`)

const errorWithHelpHint = (message: string) => {
  error(message)
  info(`Use ${chalk.blue('unleash -h')} for usage help`, 'Hint')
}

const fatal = (message: string) => {
  error(message)
  process.exit(1)
}

const ANSI = /\u001b\[[0-9;]*m/g
const visibleLength = (value: unknown) =>
  String(value ?? '').replace(ANSI, '').length

const GAP = 2
const MIN_COLUMN = 8

const NO_BORDERS = Object.fromEntries(
  [
    'top',
    'top-mid',
    'top-left',
    'top-right',
    'bottom',
    'bottom-mid',
    'bottom-left',
    'bottom-right',
    'left',
    'left-mid',
    'mid',
    'mid-mid',
    'right',
    'right-mid'
  ].map(name => [name, ''])
)

// Plain table: no borders and a dashed line under the header. Columns are sized
// to their content. If that is wider than the terminal, `flexColumn` shrinks
// first, then the widest columns, truncating text with an ellipsis.
const renderTable = (columns: string[], rows: any[][], flexColumn = -1) => {
  const available = (process.stdout.columns || 120) - 1
  const widths = columns.map((column, i) =>
    Math.max(visibleLength(column), ...rows.map(row => visibleLength(row[i])))
  )
  const total = () =>
    widths.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1)

  while (total() > available && widths[flexColumn] > MIN_COLUMN) {
    widths[flexColumn]--
  }
  while (total() > available) {
    const widest = widths.indexOf(Math.max(...widths))
    if (widths[widest] <= MIN_COLUMN) break
    widths[widest]--
  }

  const table = new Table({
    colWidths: widths,
    wordWrap: false,
    truncate: '…',
    chars: { ...NO_BORDERS, middle: ' '.repeat(GAP) },
    style: { head: [], border: [], 'padding-left': 0, 'padding-right': 0 }
  })
  table.push(columns.map(column => chalk.cyan(column)), ...rows)

  const [header, ...body] = table.toString().split('\n')
  const separator = widths.map(width => '-'.repeat(width)).join(' '.repeat(GAP))
  console.log([header, separator, ...body].join('\n'))
}

const featureTogglesTable = (featureToggles: FeatureToggleListItem[]) => {
  const columns = [
    'Name',
    'Description',
    'Type',
    'Created',
    'Seen',
    'Project ID',
    'State'
  ]
  const rows = featureToggles
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(featureToggle => [
      featureToggle.name,
      featureToggle.description,
      featureToggle.type,
      featureToggle.createdAt?.split('T')[0],
      featureToggle.lastSeenAt?.split('T')[0],
      featureToggle.project,
      featureToggle.stale ? chalk.red('Stale') : chalk.green('Active')
    ])
  renderTable(columns, rows, 1)

  info(`${config.url}features`, 'Open in Unleash')
}

const featureToggle = (featureToggle: FeatureToggle) => {
  const columns = [
    'Name',
    'Description',
    'Type',
    'Created',
    'Seen',
    'Project ID',
    'State',
    'Metrics',
    'Archived'
  ]
  const rows = [
    [
      featureToggle.name,
      featureToggle.description,
      featureToggle.type,
      featureToggle.createdAt?.split('T')[0],
      featureToggle.lastSeenAt?.split('T')[0],
      featureToggle.project,
      featureToggle.stale ? chalk.red('Stale') : chalk.green('Active'),
      featureToggle.impressionData
        ? chalk.green('Enabled')
        : chalk.red('Disabled'),
      featureToggle.archived ? chalk.red('Yes') : chalk.green('No')
    ]
  ]
  renderTable(columns, rows, 1)

  if (featureToggle.environments.length > 0) {
    const envRows = featureToggle.environments.map(env => [
      env.name,
      env.enabled ? chalk.green('Enabled') : chalk.red('Disabled')
    ])
    renderTable(['Environment', 'Enabled'], envRows)
  }

  info(
    `You can toggle this feature on a specific environment by using e.g. ${chalk.blue(
      `unleash enable -e development ${featureToggle.name}`
    )}`,
    'Hint'
  )
  info(
    `${config.url}projects/${featureToggle.project}/features/${featureToggle.name}`,
    'Open in Unleash'
  )
}

export const logger = {
  info,
  error,
  errorWithHelpHint,
  fatal,
  featureTogglesTable,
  featureToggle
}
