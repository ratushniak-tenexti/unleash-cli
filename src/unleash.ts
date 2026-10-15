#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import handleError from './utils/handleError'
import { setJq } from './utils/cli'

const args = hideBin(process.argv)

const cli = yargs(args)
  .scriptName('unleash')
  .usage(
    'CLI for interfacing with Unleash: https://www.getunleash.io/\n\nUsage: unleash <command> [options]\n\nAI agents: run "unleash docs" first for the full usage guide in one call.'
  )
  .commandDir('commands', {
    extensions: ['js', 'ts']
  })
  .option('jq', {
    type: 'string',
    global: true,
    describe:
      'Filter JSON output with a jq expression (needs jq installed), e.g. ".features[].name"'
  })
  .middleware(argv => setJq(argv.jq as string | undefined))
  .strict()
  .alias({ h: 'help', v: 'version' })
  .epilogue('https://github.com/nunogois/unleash-cli')
  .fail(handleError)

if (args.length === 0) {
  cli.showHelp()
} else {
  cli.argv
}
