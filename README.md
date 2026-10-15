# unleash-cli

CLI for interfacing with Unleash: https://www.getunleash.io/

## Install

Homebrew:
  
  ```bash
  brew install nunogois/brews/unleash
  ```

npm / yarn global install:
  
  ```bash
  npm i -g @nunogois/unleash-cli
  ```

  ```bash
  yarn global add @nunogois/unleash-cli
  ```

Or you can download the [latest release](https://github.com/nunogois/unleash-cli/releases/latest) instead.

## Setup

Before using `unleash`, you should login into your Unleash instance:

  ```bash
  unleash login
  ```

The token is stored in your system keyring (`secret-tool` on Linux, Keychain on macOS) and only the URL goes to `~/.config/unleash-cli/config.json`. The `TOKEN` and `URL` environment variables override both. A personal access token is enough, and your own permissions apply. Use `unleash logout` to remove everything.

Use `unleash -h` to see all the available commands.

## Scripting / AI agents

These commands never prompt, print JSON on stdout, print a JSON error (`error`, `status`, `details`) on stderr and exit non-zero on failure. All take `-p <project>` (default `default`) and, where relevant, `-e <environment>` (default `development`).

```bash
unleash projects
unleash environments
unleash list --json -p default
unleash toggle my-flag --json              # flag with environments, strategies, variants
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
