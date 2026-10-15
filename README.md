# unleash-cli

CLI for interfacing with Unleash: https://www.getunleash.io/

## Install

Homebrew:
  
  ```bash
  brew install nunogois/brews/unleash
  ```

npm / pnpm global install:
  
  ```bash
  npm i -g @nunogois/unleash-cli
  ```

  ```bash
  pnpm add -g @nunogois/unleash-cli
  ```

Or you can download the [latest release](https://github.com/nunogois/unleash-cli/releases/latest) instead.

## Development

This fork uses pnpm. To run your local checkout as the `unleash` binary:

  ```bash
  pnpm install
  pnpm build
  pnpm add --global link:$(pwd)
  ```

Re-run `pnpm build` after changing the code (or use `pnpm dev <command>` to run from source). Undo with `pnpm remove --global @nunogois/unleash-cli`. (pnpm 11's `pnpm link` only links into another project, so a global binary uses `pnpm add --global link:<path>`.)

## Setup

Before using `unleash`, you should login into your Unleash instance:

  ```bash
  unleash login
  ```

The token is stored in your system keyring (`secret-tool` on Linux, Keychain on macOS) and only the URL goes to `~/.config/unleash-cli/config.json`. The `TOKEN` and `URL` environment variables override both. A personal access token is enough, and your own permissions apply. Use `unleash logout` to remove everything.

Use `unleash -h` to see all the available commands.

## Scripting / AI agents

Run `unleash docs` for the whole usage guide in one call (commands, body shapes, tips).

These commands never prompt, print JSON on stdout, print a JSON error (`error`, `status`, `details`) on stderr and exit non-zero on failure. All take `-p <project>` (default `default`) and, where relevant, `-e <environment>` (default `development`).

```bash
unleash projects
unleash environments
unleash list --jq '.features[].name' -p default   # table without --jq; --jq needs jq installed
unleash toggle my-flag --jq '.environments[] | {name, enabled}'
unleash create my-flag -t experiment -d "description"
unleash update my-flag --description "new" --stale false
unleash on my-flag -e development          # or: off
unleash archive my-flag

# JSON bodies come from --file <path> or stdin
unleash variants get my-flag -e development
echo '[{"name":"v","weight":1000,"weightType":"variable","stickiness":"default","payload":{"type":"json","value":"{\"a\":1}"}}]' \
  | unleash variants set my-flag -e development     # replaces ALL variants; weights sum to 1000

unleash strategy list my-flag -e development
echo '{"name":"flexibleRollout","parameters":{"rollout":"100","stickiness":"default","groupId":"my-flag"},"constraints":[{"contextName":"environment","operator":"IN","values":["prod"]}],"variants":[],"segments":[],"disabled":false}' \
  | unleash strategy add my-flag -e development
unleash strategy update my-flag <strategy-id> -f strategy.json
unleash strategy delete my-flag <strategy-id>
```
