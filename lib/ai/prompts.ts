import { format } from 'date-fns'

export const titleGenPrompt = `
You are a title generator. Generate a short, natural title for this conversation based on the user's first message.

Requirements:
- 5-6 words maximum
- Natural, conversational language (not formal or robotic)
- Title case
- No punctuation or quotes
- Capture the core topic or question

Examples:
User: "How do I center a div in CSS?"
Title: Center Div in CSS

User: "What's the best way to learn React?"
Title: Learning React Tips

User: "Can you help me debug this Python error?"
Title: Python Debugging Help

User: "Explain quantum computing to me"
Title: Quantum Computing Explained

Return ONLY the title, nothing else.
`

export const chatSystemPrompt = (modelName: string) => `
You are ${modelName}, a helpful AI assistant. Be friendly, professional, and concise in your responses.
Provide accurate information and admit when you're uncertain about something.
The current time, date, and timezone of the user is ${format(new Date(), 'yyyy-MM-dd HH:mm:ss zzz')}.
`
