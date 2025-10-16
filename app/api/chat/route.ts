import { api } from '@/convex/_generated/api'
import { getSession } from '@/lib/auth/get-session'
import { getErrorMessage } from '@/lib/error'
import { chatSystemPrompt } from '@/lib/prompts'
import { ChatRequestSchema, MessageMetadata } from '@/lib/types'
import { createOpenAI, OpenAIResponsesProviderOptions } from '@ai-sdk/openai'
import { convertToModelMessages, createIdGenerator, smoothStream, stepCountIs, streamText } from 'ai'
import { fetchAction, fetchMutation } from 'convex/nextjs'
import { nanoid } from 'nanoid'
import { after } from 'next/server'
import { createResumableStreamContext, type ResumableStreamContext } from 'resumable-stream'

let globalStreamContext: ResumableStreamContext | null = null

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('REDIS_URL')) {
        console.log(' > Resumable streams are disabled due to missing REDIS_URL')
      } else {
        console.error(error)
      }
    }
  }

  return globalStreamContext
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await request.json()
  const parsedBody = ChatRequestSchema.safeParse(body)

  if (!parsedBody.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, chatId, model, isNewChat, useWebSearch } = parsedBody.data

  const headers = request.headers
  const apiKey = headers.get('x-api-key')

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const openai = createOpenAI({
    apiKey: apiKey,
  })

  const latestUserMessage = messages.at(-1)

  try {
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
      }).catch((error) => {
        console.error('Failed to generate chat title:', getErrorMessage(error))
      })
    }

    fetchMutation(api.chat.upsertMessage, {
      chatId,
      userId: session.user.id,
      message: latestUserMessage,
    }).catch((error) => {
      console.error('Failed to upsert user message:', getErrorMessage(error))
    })

    const startTime = Date.now()

    const response = streamText({
      model: openai(model.id),
      ...(model.supportsReasoning && {
        providerOptions: {
          openai: {
            reasoningEffort: 'medium',
            reasoningSummary: 'detailed',
          } satisfies OpenAIResponsesProviderOptions,
        },
      }),
      system: chatSystemPrompt(model.name),
      messages: convertToModelMessages(messages),
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
      stopWhen: stepCountIs(10),
      tools: {
        ...(model.supportsWebSearchTool && { web_search: openai.tools.webSearch() }),
      },
      ...(useWebSearch && model.supportsWebSearchTool && { toolChoice: { type: 'tool', toolName: 'web_search' } }), // force web_search tool when web search is enabled
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
          const elapsedTime = (endTime - startTime) / 1000
          const outputTokens = (usage?.outputTokens ?? 0) + (usage?.reasoningTokens ?? 0) // total tokens includes input + system prompt too so using this instead

          const metadata: MessageMetadata = {
            modelId: model.id,
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
      async consumeSseStream({ stream }) {
        const streamId = nanoid()

        // Create a resumable stream from the SSE stream
        const streamContext = getStreamContext()
        if (streamContext) {
          await streamContext.createNewResumableStream(streamId, () => stream)
        }

        // Update the chat with the active stream ID
        await fetchMutation(api.chat.updateChatActiveStreamId, {
          chatId,
          userId: session.user.id,
          activeStreamId: streamId,
        })
      },
    })
  } catch (error) {
    console.error('Chat route error:', error)
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
