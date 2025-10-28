import { InferToolInput, InferToolOutput, tool } from 'ai'
import Exa from 'exa-js'
import { nanoid } from 'nanoid'
import * as z from 'zod'

export const webSearchTool = tool({
  description: 'Search the web for information',
  inputSchema: z.object({
    query: z.string().min(1).max(100),
    search_type: z.enum(['auto', 'fast', 'deep']).default('auto'),
  }),
  execute: async ({ query, search_type }) => {
    const exa = new Exa(process.env.EXA_API_KEY!)

    const result = await exa.searchAndContents(query, {
      text: true,
      type: search_type,
    })

    return result.results.map((result) => {
      return {
        id: result.id ?? nanoid(),
        url: result.url,
        title: result.title,
        snippet: result.text,
        favicon: result.favicon,
        publishedDate: result.publishedDate,
      }
    })
  },
})

export type WebSearchToolInput = InferToolInput<typeof webSearchTool>
export type WebSearchToolOutput = InferToolOutput<typeof webSearchTool>
