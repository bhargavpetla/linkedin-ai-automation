# 🏎️ LinkedIn AI Automation 2.0 (Lambo Edition)

A premium, AI-powered automation suite for LinkedIn content creators. Generate high-impact posts, analyze Instagram Reels, and create professional infographics with a high-performance 3D interface.

## ✨ Features

- **🏎️ Lambo-Inspired 3D UI**: Ultra-modern, high-performance interface with real-time AI hardware visualization.
- **🧠 Advanced AI Research**: Generate professional LinkedIn posts from topics using advanced AI.
- **📱 Instagram Reel Analysis**: Convert viral reels into compelling written content via automatic transcription.
- **📊 Infographic Generation**: Create stunning visual infographics optimized for LinkedIn's algorithm.
- **💰 Cost Tracking**: Real-time monitoring of API usage and budget management.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **3D Engine**: [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) / Three.js
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **AI Services**: Google Gemini, OpenAI, Whisper
- **Database**: SQLite with Drizzle ORM

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- API Keys for Google Gemini and OpenAI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/linkedin-ai-automation.git
   cd linkedin-ai-automation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env.local` file and add your keys:
   ```env
   GOOGLE_AI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   ```

4. Initialize the database:
   ```bash
   npm run db:init
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

### Deploy on Vercel (Recommended)

1. Push your code to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add your Environment Variables in the Vercel Dashboard.
4. Deployment will be automatic!

## 📜 License

MIT License - feel free to use and adapt!
