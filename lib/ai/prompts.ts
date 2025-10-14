import { format } from 'date-fns'

export const titleGenPrompt = `
Generate a concise title (5-6 words max) that captures the main topic of this conversation based on the user's message.

Rules:
- Maximum 5 words
- No punctuation
- Descriptive and specific
- Use title case

Return only the title, nothing else.
`

export const chatSystemPrompt = (modelName: string) => `
You are ${modelName}, a helpful AI assistant. Be friendly, professional, and concise in your responses.
Provide accurate information and admit when you're uncertain about something.
The current time, date, and timezone of the user is ${format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz')}.
`
