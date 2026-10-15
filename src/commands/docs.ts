import * as archive from './archive'
import * as create from './create'
import * as disable from './disable'
import * as enable from './enable'
import * as environments from './environments'
import * as list from './list'
import * as login from './login'
import * as logout from './logout'
import * as projects from './projects'
import * as strategy from './strategy'
import * as toggle from './toggle'
import * as update from './update'
import * as variants from './variants'

export const command: string = 'docs'
export const desc: string =
  'Print the full usage guide (all commands, body shapes, tips) in one go'
export const aliases: string[] = ['guide']

const overview = `unleash: CLI for the Unleash Admin API (feature flags, variants, strategies).

Setup
  unleash login            once; the token is stored in the system keyring
  URL / TOKEN env vars     override the saved configuration

Conventions
  -p, --project      project id, default "default"
  -e, --environment  environment, default "development"
  JSON commands      print JSON on stdout; errors are JSON on stderr
                     ({"error","status","details"}) and the exit code is non-zero
  Request bodies     (variants, strategy) come from --file <path> or stdin
  Flags              per command: "unleash <command> -h" (same as --help), e.g.
                     create takes -t/--type, -d/--description; enable/disable are "on"/"off"

Keep output small
  "list" and "toggle" print a compact table by default; prefer it when you only
  need to look. "--json" prints EVERY field of every flag and is large, so pipe
  it through jq and select what you need (examples below). Do not dump it raw.`

const sections: [string, { command: string; desc?: string; examples?: string }][] =
  [
    ['Read', list],
    ['Read', toggle],
    ['Read', projects],
    ['Read', environments],
    ['Write', create],
    ['Write', update],
    ['Write', archive],
    ['Write', enable],
    ['Write', disable],
    ['Write', variants],
    ['Write', strategy],
    ['Auth', login],
    ['Auth', logout]
  ]

export const handler = () => {
  const out = [overview]
  let group = ''
  for (const [name, mod] of sections) {
    if (name !== group) {
      group = name
      out.push(`\n== ${name} ==`)
    }
    out.push(`\nunleash ${mod.command}`)
    if (mod.desc) out.push(`  ${mod.desc}`)
    if (mod.examples) {
      out.push(mod.examples.replace(/^/gm, '  '))
    }
  }
  console.log(out.join('\n'))
}
