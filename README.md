# OpenAI WebRTC Voice Chat

Real-time voice conversations with AI using OpenAI's audio models. Simple, fast, and easy to use.

## Features

- 🎙️ Real-time voice chat with AI
- 🔄 Instant AI responses
- 🌐 Edge deployment ready
- 🎨 Modern UI with Shadcn
- 📱 Mobile friendly
- ⚡ Next.js 15 App Router

## Tech Stack

- Next.js 15
- Cloudflare Pages
- Shadcn UI + Tailwind CSS
- TypeScript
- WebRTC
- OpenAI Audio API

## Getting Started

1. Clone the repository

```bash
git clone https://github.com/aitalk-im/simple-openai-webrtc-nextjs.git
cd simple-openai-webrtc-nextjs
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

4. Start development server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Deployment to Cloudflare Pages

1. Fork this repository to your GitHub account

2. Log in to Cloudflare Dashboard and go to Pages

3. Create a new project and connect your GitHub repository

4. Configure build settings:
```bash
Framework preset: Next.js
Build command: npx @cloudflare/next-on-pages@1
Build output directory: .vercel/output/static
Environment variables:
  - OPENAI_API_KEY: Your OpenAI API key
  - NODE_VERSION: 20.x
```

5. Deploy settings:
```bash
Compatibility flags:
  - nodejs_compat: true
```

6. Click "Save and Deploy"

Your app will be deployed to a `.pages.dev` domain. You can add a custom domain in the Pages settings.

### Troubleshooting

- If you encounter build errors, make sure your Node.js version is set correctly
- Verify that all environment variables are properly configured
- Check Cloudflare Pages logs for detailed error messages

## Usage

1. Open the app
2. Allow microphone access
3. Click to connect
4. Listen to AI response

## License

MIT License - feel free to use this project for any purpose.

## Support

If you find this project helpful, please give it a ⭐️

For issues and questions, please open a GitHub issue.
