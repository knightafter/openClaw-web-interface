# Open Claw Web Interface

A clean, modern web interface for [OpenClaw](https://openclaw.ai) — an end-to-end encrypted AI agent that connects to your apps (WhatsApp, Notion, Apple Notes, and more).

This project gives you a beautiful chat UI that connects directly to your local OpenClaw gateway over WebSocket, so you can talk to your AI agent from any browser.

![Open Claw Web Interface](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

---

## ✨ Features

- **Real-time streaming** — Live token-by-token responses via WebSocket
- **Markdown rendering** — Full markdown + syntax highlighting in chat
- **Skills sidebar** — See all your connected OpenClaw skills at a glance
- **WhatsApp & Notion integration** — Works with whatever channels you have connected in OpenClaw
- **Dark mode** — Built-in dark/light theme toggle
- **No API keys needed** — Connects to your local OpenClaw gateway, no external services required in this app

---

## 🛠 Prerequisites

You need **OpenClaw** installed and running on your machine.

Install OpenClaw (if not already installed):
```bash
npm install -g openclaw
```

---

## 🚀 Running the Project

### Step 1 — Start the OpenClaw gateway

```bash
openclaw gateway install
openclaw gateway start
```

Verify it's running:
```bash
openclaw status
```

You should see `Gateway: reachable` and your connected channels (e.g. WhatsApp: OK).

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Start the web interface

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 4 — Connect

On first launch you'll see an onboarding screen asking for:

| Field | Value |
|-------|-------|
| **Gateway URL** | `ws://127.0.0.1:18789` |
| **Token** | Your OpenClaw auth token (find it in `~/.openclaw/openclaw.json`) |

Once connected, you can start chatting with your AI agent.

---

## 🔑 Secret Keys & Security

**This project contains no hardcoded API keys or secrets.**

- The only credential is your OpenClaw **auth token**, which you enter in the UI at runtime — it is never stored in the codebase
- OpenClaw itself manages your AI provider keys (Gemini, etc.) separately in `~/.openclaw/`
- The gateway only listens on `127.0.0.1` (loopback) — it is not exposed to the internet

---

## 🏗 Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org) | React framework |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com) | Styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Zustand](https://zustand-demo.pmnd.rs/) | State management |
| [react-markdown](https://github.com/remarkjs/react-markdown) | Markdown rendering |

---

## 📁 Project Structure

```
src/
├── app/              # Next.js app router (layout, page, globals)
├── components/
│   ├── chat/         # Chat interface, messages, input
│   ├── onboarding/   # Connection setup flow
│   ├── sidebar/      # Skills & channels sidebar
│   └── ui/           # Reusable UI components
├── lib/              # WebSocket client, HTTP client, utilities
├── stores/           # Zustand state (connection, chat)
└── types/            # TypeScript interfaces
```

---

## 🌐 Connecting to OpenClaw on a VPS (Remote Server)

By default OpenClaw only listens on `127.0.0.1` (loopback), so if your OpenClaw is running on a remote VPS you need to forward the port to your local machine first.

### Option 1 — SSH Tunnel (Recommended, most secure)

Run this on your **local machine**:

```bash
ssh -L 18789:127.0.0.1:18789 user@your-vps-ip
```

Keep that terminal open. Now the VPS gateway is available locally at `ws://127.0.0.1:18789`.

Then in the web interface connection screen use:

| Field | Value |
|-------|-------|
| **Gateway URL** | `ws://127.0.0.1:18789` |
| **Token** | Your OpenClaw token from the VPS (`~/.openclaw/openclaw.json`) |

### Option 2 — Bind to a public port on the VPS

On the VPS, edit `~/.openclaw/openclaw.json` and set:

```json
{
  "gateway": {
    "bind": "0.0.0.0",
    "port": 18789
  }
}
```

Then restart the gateway:

```bash
openclaw gateway stop
openclaw gateway start
```

In the web interface use:

| Field | Value |
|-------|-------|
| **Gateway URL** | `ws://your-vps-ip:18789` |
| **Token** | Your OpenClaw token from the VPS |

> ⚠️ **Warning:** Binding to `0.0.0.0` exposes the port publicly. Make sure your VPS firewall only allows trusted IPs, or use the SSH tunnel option instead.

---

## 🛑 Stopping the Gateway

```bash
openclaw gateway stop
```

---

## 🤝 Contributing

Pull requests are welcome! Feel free to open an issue for bugs or feature requests.

---

## 📄 License

MIT
