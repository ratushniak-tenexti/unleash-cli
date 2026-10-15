import { ROUTES } from './api'

const enc = encodeURIComponent

export const projectPath = (project: string) =>
  `${ROUTES.API_ADMIN}/projects/${enc(project)}`

export const featurePath = (project: string, feature: string) =>
  `${projectPath(project)}/features/${enc(feature)}`

export const envPath = (project: string, feature: string, environment: string) =>
  `${featurePath(project, feature)}/environments/${enc(environment)}`
