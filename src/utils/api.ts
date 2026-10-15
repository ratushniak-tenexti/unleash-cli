import axios from 'axios'
import chalk from 'chalk'
import { config } from './config'
import { logger } from './logger'

export enum ROUTES {
  API_ADMIN = 'api/admin'
  // OPENAPI_SPEC = 'docs/openapi.json',
  // SWAGGER = 'docs/openapi/'
}

const getUrl = (url: string) => {
  if (!config.isValid()) {
    logger.fatal(
      `Invalid configuration. Please run ${chalk.cyan('unleash setup')} first.`
    )
  }

  if (url.startsWith('http')) {
    return url
  }
  const trailingSlash = config.url.endsWith('/') ? '' : '/'
  return config.url + trailingSlash + url
}

const getConfig = () => ({
  headers: {
    Authorization: config.token ?? ''
  }
})

const get = async <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
  axios.get(getUrl(url), { ...getConfig(), params }).then(res => res.data)

const post = async <T>(url: string, data: unknown = {}): Promise<T> =>
  axios.post(getUrl(url), data, getConfig()).then(res => res.data)

const put = async <T>(url: string, data: unknown = {}): Promise<T> =>
  axios.put(getUrl(url), data, getConfig()).then(res => res.data)

const patch = async <T>(url: string, data: unknown = {}): Promise<T> =>
  axios.patch(getUrl(url), data, getConfig()).then(res => res.data)

const del = async <T>(url: string): Promise<T> =>
  axios.delete(getUrl(url), getConfig()).then(res => res.data)

export const api = {
  get,
  post,
  put,
  patch,
  delete: del
}
