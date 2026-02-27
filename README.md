# 🦞 OpenClaw Web Interface

> A beautiful, self-hosted chat UI for your [OpenClaw](https://openclaw.ai) AI agent — run it locally or on a VPS, no third-party apps required.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss) ![License](https://img.shields.io/badge/license-MIT-green)

---

## 🤔 What is this?

OpenClaw is an AI agent that connects to your apps — WhatsApp, Notion, Apple Notes, and more. It normally lives inside WhatsApp or Telegram, but those apps are limited:

- No markdown rendering
- No code syntax highlighting
- Messages go through Meta or Telegram servers
- No visibility into what skills/tools your agent has

**This project gives OpenClaw a proper home.** A clean, fast, self-hosted web interface that connects directly to your OpenClaw gateway over WebSocket — fully local, fully private, fully yours.

---

## ✨ Features

- 💬 **Real-time streaming** — See responses token by token as the AI thinks
- 📝 **Full Markdown** — Tables, code blocks, syntax highlighting, bold, lists — all rendered beautifully
- 🧠 **Skills sidebar** — See every tool and skill your agent has connected at a glance
- 🔒 **100% Private** — Everything runs locally, no data ever leaves your machine
- 🌙 **Dark / Light mode** — Built-in theme toggle
- 🔑 **Zero API keys** — No OpenAI key, no Gemini key, nothing. Just connect to your local gateway
- 🖥️ **VPS ready** — Run it on a server and access it from anywhere via SSH tunnel
- ⚡ **Fast** — Built with Next.js 15 and Tailwind CSS 4

---

## 🆚 Why use this instead of WhatsApp or Telegram?

| Feature | This Web UI | WhatsApp / Telegram |
|---------|-------------|---------------------|
| Markdown + code rendering | ✅ Full support | ❌ Plain text only |
| Privacy (local only) | ✅ Never leaves your machine | ⚠️ Goes through Meta/Telegram |
| Skills visibility | ✅ Sidebar shows all tools | ❌ Hidden |
| No phone required | ✅ Just a browser | ❌ Phone must stay online |
| Self hosted | ✅ You own everything | ❌ Closed platforms |
| Rate limits | ✅ None | ⚠️ Limits apply |
| VPS friendly | ✅ SSH tunnel support | ❌ Complicated |

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org) 18+
- [OpenClaw](https://openclaw.ai) installed and running

Install OpenClaw:

```bash
npm install -g openclaw
```

---

## 🚀 Getting Started

### 1. Start OpenClaw gateway

```bash
openclaw gateway install
openclaw gateway start
```

Check it is running:

```bash
openclaw status
```

You should see `Gateway: reachable` and your channels (e.g. `WhatsApp: OK`).

### 2. Clone this repo

```bash
git clone https://github.com/knightafter/openClaw-web-interface.git
cd openClaw-web-interface
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Connect to your gateway

On first launch enter:

| Field | Value |
|-------|-------|
| **Gateway URL** | `ws://127.0.0.1:18789` |
| **Token** | Found in `~/.openclaw/openclaw.json` |

---

## 🖥️ Running on a VPS

If OpenClaw is running on a remote server, use an SSH tunnel to connect securely:

```bash
ssh -L 18789:127.0.0.1:18789 user@your-vps-ip
```

Then use `ws://127.0.0.1:18789` as your gateway URL — same as local. No firewall changes needed.

---

## 🔐 Security & Secrets

**This project has zero hardcoded secrets or API keys.**

- No `.env` file needed
- No Gemini, OpenAI, or any other API key stored here
- Your OpenClaw auth token is entered in the UI at runtime and never stored in this codebase
- All communication stays on your local machine

---

## 🧱 Tech Stack

| Tech | Purpose |
|------|---------|
| Next.js 15 | React framework |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| WebSocket | Real-time gateway connection |
| React Markdown | Markdown rendering |

---

## 🤝 Contributing

Pull requests are welcome! If you find a bug or want a new feature, open an issue first so we can discuss it.

```bash
git checkout -b feature/your-feature
git commit -m "add your feature"
git push origin feature/your-feature
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

> Built for people who want to own their AI, not rent it.
