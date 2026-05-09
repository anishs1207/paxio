# Paxio — The Ultimate AI Crew for Your Daily Life 🚀

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Paxio is your personal AI team, designed to handle the repetitive tasks of daily life so you can focus on what matters most: building wealth and connecting with people. It's not just a chatbot; it's a multimodal agentic system that lives where you do.

---

## ✨ Key Features

### 🤖 Specialized AI Assistants
*   **Personal Assistant (Donna/Lucy):** Manages your communications (Gmail, Slack) and schedules (Calendar, Cal.com). It autoreplies, flags urgent messages, and syncs meetings.
*   **Legal Assistant (Specter):** Your pocket expert on Indian Law, constitutional acts, and landmark judgments. Understand legal jargon without the expensive consulting fees.
*   **Finance Assistant:** Analyzes bank statements (PDF/Image), tracks expenses, generates P&L reports, and offers smart investment guidance.
*   **Shopping Agent:** Research products, compare prices across platforms (Blinkit, Amazon, Flipkart), and even automate the ordering process.
*   **Social Coach:** Scans for viral trends on Instagram/Twitter/Reddit and helps you craft a content strategy that actually works.

### 🎙️ Multimodal Experience
*   **Voice First:** Talk to Paxio naturally. Whether it's a voice note on WhatsApp or a real-time call, Paxio understands and acts.
*   **Memory Tracking:** Paxio remembers. Using a complex system of Short Term, Long Term, and Working Memory, it adapts to your style and preferences over time.
*   **Cross-Platform:** Access Paxio via WhatsApp, phone calls, or our dedicated web platform.

### ⚡ Quick Actions & Shortcuts
*   `/rg` — Read Gmail
*   `/cc` — Check Calendar
*   `/sg` — Send Gmail
*   `@tool` — Access specific agent tools
*   `@sn` — Save a quick note

---

## 🛠️ Tech Stack

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
*   **Intelligence:** [Google Gemini](https://ai.google.dev/), [LangChain](https://www.langchain.com/), [Browser-use SDK](https://github.com/browser-use/browser-use)
*   **Audio/Voice:** [Deepgram](https://www.deepgram.com/), [Cartesia](https://cartesia.ai/), [AssemblyAI](https://www.assemblyai.com/)
*   **Backend & DB:** [Prisma](https://www.prisma.io/), [Node-cron](https://www.npmjs.com/package/node-cron)
*   **Integrations:** Gmail API, Google Calendar API, Notion API, Razorpay, Dodo Payments

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- NPM / PNPM

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/anishs1207/paxio.git
    cd paxio
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Copy `.env.sample` to `.env` and fill in your API keys for Gemini, Deepgram, etc.
4.  **Initialize Database:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```
5.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3001](http://localhost:3001) to see the result.

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), and [SECURITY.md](SECURITY.md) for details on how to get started and report vulnerabilities.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
