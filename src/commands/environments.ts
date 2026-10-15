import { api, ROUTES } from '../utils/api'
import { run } from '../utils/cli'

export const command: string = 'environments'
export const desc: string = 'List environments (JSON)'

export const handler = () =>
  run(() => api.get(`${ROUTES.API_ADMIN}/environments`))
