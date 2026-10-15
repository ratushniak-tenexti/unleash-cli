import { api, ROUTES } from './api'

const A = ROUTES.API_ADMIN
const feature = (project: string, flag: string) =>
  `${A}/projects/${encodeURIComponent(project)}/features/${encodeURIComponent(
    flag
  )}`
const envPath = (project: string, flag: string, environment: string) =>
  `${feature(project, flag)}/environments/${encodeURIComponent(environment)}`

// Tools must never throw or return raw axios errors (huge, circular): the model
// gets a compact { error } object instead and can explain/retry.
const safe =
  <P>(fn: (params: P) => Promise<unknown>) =>
  async (params: P) => {
    try {
      const result = await fn(params)
      return result === undefined || result === '' ? { success: true } : result
    } catch (e: any) {
      const body = e?.response?.data
      return {
        error: e?.message,
        status: e?.response?.status,
        details: body?.details ?? body?.message ?? body
      }
    }
  }

const str = { type: 'string' }
const project = { ...str, description: 'Project id, e.g. "default"' }
const flag = { ...str, description: 'Feature flag name' }
const environment = { ...str, description: 'Environment name, e.g. "development"' }

const variantSchema = {
  type: 'object',
  properties: {
    name: str,
    weight: {
      type: 'number',
      description:
        'Weight from 0 to 1000 (1000 = 100%). All variants must sum to 1000.'
    },
    weightType: {
      type: 'string',
      enum: ['variable', 'fix'],
      description:
        '"variable" shares what remains after "fix" variants; defaults to variable'
    },
    stickiness: { ...str, description: 'Context field, default "default"' },
    payload: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['string', 'json', 'csv', 'number'] },
        value: str
      },
      required: ['type', 'value']
    },
    overrides: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contextName: str,
          values: { type: 'array', items: str }
        },
        required: ['contextName', 'values']
      }
    }
  },
  required: ['name', 'weight']
}

const constraintsSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      contextName: str,
      operator: {
        ...str,
        description: 'e.g. IN, NOT_IN, STR_CONTAINS, NUM_GT, DATE_AFTER, SEMVER_EQ'
      },
      values: { type: 'array', items: str },
      value: str,
      inverted: { type: 'boolean' },
      caseInsensitive: { type: 'boolean' }
    },
    required: ['contextName', 'operator']
  }
}

const strategyProps = {
  name: {
    ...str,
    description:
      'Strategy name, e.g. "flexibleRollout", "default", "userWithId", "remoteAddress"'
  },
  parameters: {
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Strategy parameters as strings, e.g. flexibleRollout: {"rollout":"50","stickiness":"default","groupId":"<flag>"}; userWithId: {"userIds":"a,b"}'
  },
  constraints: constraintsSchema,
  variants: {
    type: 'array',
    description:
      'Strategy-level variants (e.g. a JSON config payload served when the strategy matches). Weights sum to 1000.',
    items: variantSchema
  },
  segments: {
    type: 'array',
    items: { type: 'number' },
    description: 'Segment ids'
  },
  title: str,
  disabled: { type: 'boolean' }
}

type Tool = {
  type: 'function'
  function: {
    function: (params: any) => Promise<unknown>
    description: string
    parse: (input: string) => unknown
    parameters: Record<string, unknown>
  }
}

const tool = <P>(
  fn: (params: P) => Promise<unknown>,
  description: string,
  properties: Record<string, unknown>,
  required: string[]
): Tool => ({
  type: 'function',
  function: {
    function: safe(fn),
    description,
    parse: JSON.parse,
    parameters: { type: 'object', properties, required }
  }
})

export const tools: Tool[] = [
  tool(
    () => api.get(`${A}/projects`),
    'List all projects',
    {},
    []
  ),
  tool(
    () => api.get(`${A}/environments`),
    'List all environments',
    {},
    []
  ),
  tool(
    () => api.get(`${A}/feature-types`),
    'List feature flag types (release, experiment, operational, kill-switch, permission)',
    {},
    []
  ),
  tool(
    ({ project }: { project: string }) =>
      api.get(`${A}/projects/${encodeURIComponent(project)}/features`),
    'List the feature flags of a project',
    { project },
    ['project']
  ),
  tool(
    ({ project, flag }: { project: string; flag: string }) =>
      api.get(feature(project, flag)),
    'Get a feature flag (including environments, strategies and variants)',
    { project, flag },
    ['project', 'flag']
  ),
  tool(
    (p: {
      project: string
      name: string
      type?: string
      description?: string
      impressionData?: boolean
    }) => {
      const { project, ...body } = p
      return api.post(
        `${A}/projects/${encodeURIComponent(project)}/features`,
        body
      )
    },
    'Create a feature flag. It starts disabled in every environment and has no strategies; use the other tools to enable it and configure it.',
    {
      project,
      name: { ...str, description: 'URL-safe flag name (letters, digits, - _ . ~)' },
      type: { ...str, description: 'Flag type, default "release"' },
      description: str,
      impressionData: { type: 'boolean' }
    },
    ['project', 'name']
  ),
  tool(
    ({ project, flag }: { project: string; flag: string }) =>
      api.delete(feature(project, flag)),
    'Archive a feature flag. Destructive: confirm with the user first.',
    { project, flag },
    ['project', 'flag']
  ),
  tool(
    ({
      project,
      flag,
      environment,
      enabled
    }: {
      project: string
      flag: string
      environment: string
      enabled: boolean
    }) =>
      api.post(
        `${envPath(project, flag, environment)}/${enabled ? 'on' : 'off'}`
      ),
    'Enable or disable a feature flag in an environment',
    { project, flag, environment, enabled: { type: 'boolean' } },
    ['project', 'flag', 'environment', 'enabled']
  ),
  tool(
    (p: {
      project: string
      flag: string
      patch: Record<string, unknown>
    }) => api.put(feature(p.project, p.flag), p.patch),
    'Update flag metadata. Send fields such as description, type, stale, impressionData (PUT; include every field you want to keep, so fetch the flag first).',
    {
      project,
      flag,
      patch: {
        type: 'object',
        properties: {
          name: str,
          description: str,
          type: str,
          stale: { type: 'boolean' },
          impressionData: { type: 'boolean' }
        }
      }
    },
    ['project', 'flag', 'patch']
  ),
  // --- variants (per environment) ---
  tool(
    ({
      project,
      flag,
      environment
    }: {
      project: string
      flag: string
      environment: string
    }) => api.get(`${envPath(project, flag, environment)}/variants`),
    'Get the variants of a flag in an environment',
    { project, flag, environment },
    ['project', 'flag', 'environment']
  ),
  tool(
    ({
      project,
      flag,
      environment,
      variants
    }: {
      project: string
      flag: string
      environment: string
      variants: unknown[]
    }) =>
      api.put(`${envPath(project, flag, environment)}/variants`, variants),
    'Overwrite ALL variants of a flag in an environment. To add/remove/change one variant, get the current ones first and send the full new list. Weights must sum to 1000 (an empty list removes all variants).',
    {
      project,
      flag,
      environment,
      variants: { type: 'array', items: variantSchema }
    },
    ['project', 'flag', 'environment', 'variants']
  ),
  // --- strategies ---
  tool(
    (p: {
      project: string
      flag: string
      environment: string
      strategy: Record<string, unknown>
    }) =>
      api.post(
        `${envPath(p.project, p.flag, p.environment)}/strategies`,
        p.strategy
      ),
    'Add an activation strategy to a flag in an environment',
    {
      project,
      flag,
      environment,
      strategy: {
        type: 'object',
        properties: strategyProps,
        required: ['name']
      }
    },
    ['project', 'flag', 'environment', 'strategy']
  ),
  tool(
    (p: {
      project: string
      flag: string
      environment: string
      strategyId: string
      strategy: Record<string, unknown>
    }) =>
      api.put(
        `${envPath(p.project, p.flag, p.environment)}/strategies/${
          p.strategyId
        }`,
        p.strategy
      ),
    'Replace an existing strategy (get the flag first to find strategy ids)',
    {
      project,
      flag,
      environment,
      strategyId: str,
      strategy: { type: 'object', properties: strategyProps }
    },
    ['project', 'flag', 'environment', 'strategyId', 'strategy']
  ),
  tool(
    (p: {
      project: string
      flag: string
      environment: string
      strategyId: string
    }) =>
      api.delete(
        `${envPath(p.project, p.flag, p.environment)}/strategies/${
          p.strategyId
        }`
      ),
    'Delete a strategy from a flag in an environment. Confirm with the user first.',
    { project, flag, environment, strategyId: str },
    ['project', 'flag', 'environment', 'strategyId']
  )
]
