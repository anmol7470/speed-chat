# Speed Chat

An AI chat application built with Next.js 15, Convex, and AI SDK v5, featuring multiple AI models from OpenAI, file (images and PDFs) upload support, built-in web search, and resumable streams.

## 🚀 Features

- **Multiple AI Models** - Support for multiple OpenAI models
- **Web Search Integration** - Enhanced responses with real-time web search
- **Image Upload Support** - Upload and send images and PDFs with your messages
- **Persistent Chat History** - Fully synced chat history to use across devices
- **Branching Conversations** - Create a new chat from an existing message in a chat
- **Search Chats** - Search through your chat history and messages
- **Formatting** - Beautiful formatting of code, latex, tables in AI responses to improve chat experience
- **Resumable Streams** - Streams automatically resume when page is refreshed or client navigates between chats

## 🛠 Tech Stack

- [Next.js 15 App Router](https://nextjs.org) - Full stack React framework with server components/actions and api routes
- [React 19](https://react.dev) - Latest React
- [Convex](https://www.convex.dev) - Reactive backend as a service platform
- [Convex Helpers](https://github.com/get-convex/convex-helpers) - Helpers to extend the Convex SDK
- [AI SDK](https://ai-sdk.dev) - Typescript AI toolkit to build AI applications
- [Better Auth](https://better-auth.com) - Comprehensive auth library
- [TailwindCSS v4](https://tailwindcss.com) - Inline CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Modern component library built on Radix UI
- [resumable-stream](https://github.com/vercel/resumable-stream) - Resumable streams for AI SDK

## 📦 Getting Started

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/anmhrk/speed-chat.git
cd speed-chat
bun install # or whatever package manager you prefer
```

2. Setup the .env.local file:

```bash
cp .env.example .env.local
# Edit the .env.local file with your own values
# Convex env vars will be set automatically in the next step
```

3. Push the auth schema to your postgres database:

```bash
bun run push-auth-schema
```

2. Start the Convex development server and the Next.js development server:

```bash
bun run dev:convex
bun run dev # app will be available at http://localhost:3000
```
