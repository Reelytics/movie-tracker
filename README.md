# MovieTracker 🎬

A full-stack movie tracking application with AI-powered ticket scanning capabilities.

## Features

- 📱 **Movie Tracking**: Keep track of movies you've watched
- 🎫 **AI Ticket Scanning**: Upload movie tickets and extract information using AI vision APIs
- 🤖 **Multiple AI Providers**: Supports OpenAI, Anthropic Claude, Google Gemini, and Azure vision APIs
- 👤 **User Authentication**: Secure user accounts and profiles
- 🎭 **Genre Preferences**: Personalized movie recommendations
- 📊 **Movie Analytics**: Track your viewing habits and preferences

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **AI Vision**: OpenAI GPT-4 Vision, Claude 3, Gemini Vision
- **Deployment**: Railway with automated CI/CD

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Environment Variables

Required environment variables are listed in `.env.example`. You'll need API keys for:
- OpenAI (for GPT-4 Vision)
- Anthropic (for Claude 3)
- Google AI (for Gemini Vision)
- TMDB (for movie data)

## Deployment

This project is configured for automatic deployment to Railway via GitHub Actions. Push to the main branch to trigger deployment.

---

Built with ❤️ by Reelytics
