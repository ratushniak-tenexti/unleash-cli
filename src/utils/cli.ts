import fs from 'fs'
import { spawnSync } from 'child_process'

let jqExpression: string | undefined

// Set from the global --jq option. When set, JSON output goes through jq.
export const setJq = (expression?: string) => {
  jqExpression = expression
}

export const jqActive = () => jqExpression !== undefined

// Like `jq -r`: strings are printed raw, everything else as JSON.
const applyJq = (json: string, expression: string) => {
  const result = spawnSync('jq', ['-r', expression], {
    input: json,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024
  })
  if ((result.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
    throw new Error('--jq needs the jq binary on your PATH (https://jqlang.org)')
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'jq failed')
  }
  return result.stdout.replace(/\n$/, '')
}

export const print = (data: unknown) => {
  const json = JSON.stringify(
    data === undefined || data === '' ? { success: true } : data,
    null,
    2
  )
  console.log(jqExpression === undefined ? json : applyJq(json, jqExpression))
}

// Compact, machine-readable error. Unleash puts its validation messages in
// response.data.details (or message).
export const formatError = (e: any) => {
  const body = e?.response?.data
  return {
    error: e?.message,
    status: e?.response?.status,
    details: body?.details ?? body?.message ?? body
  }
}

// Runs a command body: JSON on stdout on success, JSON on stderr and a
// non-zero exit code on failure.
export const run = async (fn: () => Promise<unknown>) => {
  try {
    print(await fn())
  } catch (e: any) {
    console.error(JSON.stringify(formatError(e), null, 2))
    process.exitCode = 1
  }
}

const readStdin = () =>
  new Promise<string>((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })

// JSON body from --file <path>, or from stdin when --file is "-" or omitted
// and stdin is piped.
export const readJson = async (file?: string): Promise<any> => {
  let raw: string
  if (file && file !== '-') {
    raw = fs.readFileSync(file, 'utf8')
  } else if (file === '-' || !process.stdin.isTTY) {
    raw = await readStdin()
  } else {
    throw new Error('Provide a JSON body with --file <path> or via stdin')
  }
  try {
    return JSON.parse(raw)
  } catch (e: any) {
    throw new Error(`Invalid JSON: ${e.message}`)
  }
}
