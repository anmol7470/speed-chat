# Speed Chat

An AI chat application built with Next.js, Convex, and Vercel AI SDK, featuring multiple AI models via OpenRouter, file (images and PDFs) upload support, web search, and resumable streams.

## 🚀 Features

- **Multiple AI Models** - Support for multiple models via OpenRouter
- **Web Search Integration** - Enhanced responses with real-time web search using Exa API
- **File Upload Support** - Upload and send images and PDFs with your messages
- **Persistent Chat History** - Fully synced chat history to use across devices
- **Branching Conversations** - Create a new chat from an existing message in a chat
- **Search Chats** - Search through your chat history and messages
- **Formatting** - Beautiful formatting of code, latex, tables in AI responses to improve chat experience
- **Resumable Streams** - Streams automatically resume when page is refreshed or client navigates between chats
- **Share Chats** - Share your chats and allow other users to fork their own copy

## 🛠 Tech Stack

- [Next.js 16 App Router](https://nextjs.org) - Full stack React framework with server components/actions and api routes
- [React](https://react.dev) - Library for web and native user interfaces
- [Convex](https://www.convex.dev) - Reactive backend as a service platform
- [Convex Helpers](https://github.com/get-convex/convex-helpers) - Helpers to extend the Convex SDK
- [AI SDK](https://ai-sdk.dev) - Typescript AI toolkit to build AI applications
- [Better Auth](https://convex-better-auth.netlify.app) - Better Auth Convex integration
- [TailwindCSS v4](https://tailwindcss.com) - Inline CSS framework
- [shadcn/ui](https://ui.shadcn.com) - Modern component library built on Radix UI
- [resumable-stream](https://github.com/vercel/resumable-stream) - Resumable streams for AI SDK
- [Exa API](https://exa.ai) - Web search API
- [OpenRouter](https://openrouter.ai) - Unified API routing for LLMs

## 📦 Getting Started

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/anmol7470/speed-chat.git
cd speed-chat
bun install # or whatever package manager you prefer
```

2. Setup the .env.local file:

```bash
cp .env.example .env.local
# Edit the .env.local file with your own values
# Convex env vars will be set automatically in the next step
```

3. Setup Convex dev server:

```bash
bun run dev:convex
```

4. Setup env vars in Convex:

```bash
bunx convex env set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
bunx convex env set SITE_URL http://localhost:3000
bunx convex env set GOOGLE_CLIENT_ID your_google_client_id
bunx convex env set GOOGLE_CLIENT_SEVRET your_google_client_secret
# Following https://convex-better-auth.netlify.app/framework-guides/next
```

5. Start the Next.js development server:

```bash
bun run dev # app will be available at http://localhost:3000
```

## Todos

- [ ] Add a way to stop the stream. Currently its [not compatible](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams) with AI SDK when using resume streams.
