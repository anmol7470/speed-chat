import { api } from '@/convex/_generated/api'
import { getErrorMessage } from '@/lib/error'
import { chatSystemPrompt } from '@/lib/prompts'
import { getStreamContext } from '@/lib/stream-context'
import { ChatRequestSchema, MessageMetadata } from '@/lib/types'
import { webSearchTool } from '@/lib/web-search-tool'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, createIdGenerator, smoothStream, stepCountIs, streamText } from 'ai'
import { fetchAction, fetchMutation } from 'convex/nextjs'
import { nanoid } from 'nanoid'

export async function POST(request: Request) {
  const token = await convexAuthNextjsToken()

  if (!token) {
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

  const { messages, chatId, model, isNewChat, useWebSearch, useReasoning } = parsedBody.data

  const headers = request.headers
  const apiKey = headers.get('x-api-key')

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const openrouter = createOpenRouter({
    apiKey: apiKey,
  })

  const latestUserMessage = messages.at(-1)

  try {
    if (isNewChat) {
      await fetchMutation(
        api.chat.createChat,
        {
          chatId,
        },
        {
          token,
        }
      )

      fetchAction(
        api.chat.generateChatTitle,
        {
          chatId,
          apiKey,
          userMessage: latestUserMessage,
        },
        {
          token,
        }
      ).catch((error) => {
        console.error('Failed to generate chat title:', getErrorMessage(error))
      })
    }

    fetchMutation(
      api.chat.upsertMessage,
      {
        chatId,
        message: latestUserMessage,
      },
      {
        token,
      }
    ).catch((error) => {
      console.error('Failed to upsert user message:', getErrorMessage(error))
    })

    const response = streamText({
      model: openrouter(model.id, {
        extraBody: {
          include_reasoning: model.supportsReasoning && model.reasoningConfigurable ? useReasoning : true,
        },
      }),
      system: chatSystemPrompt(model.name),
      messages: convertToModelMessages(messages),
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
      stopWhen: stepCountIs(10),
      tools: {
        web_search: webSearchTool,
      },
      toolChoice: useWebSearch ? 'required' : 'auto', // force web_search tool when web search is enabled
    })

    return response.toUIMessageStreamResponse({
      generateMessageId: () =>
        createIdGenerator({
          prefix: 'assistant',
          size: 16,
        })(),
      messageMetadata: () => {
        const metadata: MessageMetadata = {
          modelId: model.id,
        }

        return metadata
      },
      onFinish: async ({ responseMessage }) => {
        await fetchMutation(
          api.chat.upsertMessage,
          {
            chatId,
            message: responseMessage,
          },
          {
            token,
          }
        )
      },
      async consumeSseStream({ stream }) {
        const streamId = nanoid()

        // Create a resumable stream from the SSE stream
        const streamContext = getStreamContext()
        if (streamContext) {
          await streamContext.createNewResumableStream(streamId, () => stream)
        }

        // Update the chat with the active stream ID
        await fetchMutation(
          api.chat.updateChatActiveStreamId,
          {
            chatId,
            activeStreamId: streamId,
          },
          {
            token,
          }
        )
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
