import OpenAI from 'openai'
import { config } from './config'
import { tools } from './aiTools'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { Spinner } from 'nanospinner'

let client: OpenAI | undefined

const initOpenAI = (spinner: Spinner) => {
  if (!client) {
    if (!config.openAIToken) {
      spinner.error()
      throw new Error('OpenAI token is not set. Please run unleash setup.')
    }
    client = new OpenAI({
      apiKey: config.openAIToken
    })
  }
  return client
}

export const ai = async (
  conversationHistory: ChatCompletionMessageParam[],
  spinner: Spinner
) => {
  const client = initOpenAI(spinner)
  const stream = client.beta.chat.completions.runTools({
    model: 'gpt-4o-mini',
    messages: conversationHistory,
    stream: true,
    tools
  })

  let loading = true
  for await (const chunk of stream) {
    if (loading && chunk.choices[0]?.delta?.content) {
      spinner.success({ text: 'Answer:' })
      loading = false
    }
    process.stdout.write(chunk.choices[0]?.delta?.content || '')
  }
  process.stdout.write('\n')

  return stream.finalContent()
}
