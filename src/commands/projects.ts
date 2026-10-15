import { api, ROUTES } from '../utils/api'
import { run } from '../utils/cli'

export const command: string = 'projects'
export const desc: string = 'List projects (JSON)'

export const handler = () => run(() => api.get(`${ROUTES.API_ADMIN}/projects`))
