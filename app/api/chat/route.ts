import { api } from '@/convex/_generated/api'
import { chatSystemPrompt } from '@/lib/ai/prompts'
import { getSession } from '@/lib/auth/get-session'
import { ChatRequestSchema, MessageMetadata } from '@/lib/types'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, createIdGenerator, smoothStream, stepCountIs, streamText } from 'ai'
import { fetchAction, fetchMutation } from 'convex/nextjs'

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await request.json()
  const parsedBody = ChatRequestSchema.safeParse(body)

  if (!parsedBody.success) {
    return new Response('Invalid request body', { status: 400 })
  }

  const { messages, chatId, model, isNewChat } = parsedBody.data

  const headers = request.headers
  const apiKey = headers.get('x-api-key')

  if (!apiKey) {
    return new Response('Missing API key', { status: 400 })
  }

  const shouldUseReasoning = model.reasoningModel === true

  const openrouter = createOpenRouter({
    apiKey: apiKey,
  })

  const latestUserMessage = messages.at(-1)

  if (isNewChat) {
    await fetchMutation(api.chat.createChat, {
      userId: session.user.id,
      chatId,
    })

    fetchAction(api.chat.generateChatTitle, {
      chatId,
      apiKey,
      userId: session.user.id,
      userMessage: latestUserMessage,
    })
  }

  fetchMutation(api.chat.upsertMessage, {
    chatId,
    userId: session.user.id,
    message: latestUserMessage,
  })

  const startTime = Date.now()
  let ttftCalculated = false
  let ttft = 0

  const response = streamText({
    model: openrouter(model.id),
    // TODO: check this config to see if it works
    ...(shouldUseReasoning && {
      providerOptions: {
        anthropic: {
          thinking: {
            type: 'enabled',
            budgetTokens: 15_000,
          },
        },
        openai: {
          reasoningEffort: 'medium',
          reasoningSummary: 'detailed',
        },
        google: {
          thinkingConfig: {
            thinkingBudget: 15_000,
            includeThoughts: true,
          },
        },
      },
    }),
    system: chatSystemPrompt(model.name),
    messages: convertToModelMessages(messages),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: 'word',
    }),
    stopWhen: stepCountIs(10),
    onChunk: (event) => {
      if (
        !ttftCalculated &&
        (event.chunk.type === 'text-delta' ||
          event.chunk.type === 'reasoning-delta' ||
          event.chunk.type === 'tool-call')
      ) {
        // Time to first token (in seconds) the moment text delta or reasoning or tool call starts
        ttft = (Date.now() - startTime) / 1000
        ttftCalculated = true
      }
    },
  })

  return response.toUIMessageStreamResponse({
    generateMessageId: () =>
      createIdGenerator({
        prefix: 'assistant',
        size: 16,
      })(),
    messageMetadata: ({ part }) => {
      if (part.type === 'finish') {
        const usage = part.totalUsage
        const endTime = Date.now()
        const elapsedTime = endTime - startTime
        const outputTokens = (usage?.outputTokens ?? 0) + (usage?.reasoningTokens ?? 0) // total tokens includes input + system prompt too so using this instead
        const tps = outputTokens ? outputTokens / (elapsedTime / 1000) : 0

        const metadata: MessageMetadata = {
          modelName: model.name,
          tps,
          ttft,
          elapsedTime,
          completionTokens: outputTokens,
        }

        return metadata
      }
    },
    onFinish: async ({ responseMessage }) => {
      await fetchMutation(api.chat.upsertMessage, {
        chatId,
        userId: session.user.id,
        message: responseMessage,
      })
    },
  })
}
