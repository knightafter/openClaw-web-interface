# Open Claw Web Interface - Architecture Guide

## 📁 Project Structure Overview

```
src/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with Inter font
│   ├── page.tsx                  # Main page - switches between onboarding & chat
│   └── globals.css               # Global styles & Tailwind import
│
├── components/                    # All React components
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx           # Button with variants (primary, secondary, ghost)
│   │   ├── Input.tsx            # Input field with label & error states
│   │   ├── Card.tsx             # Card container
│   │   └── LoadingSpinner.tsx   # Loading spinner (sm, md, lg)
│   │
│   ├── onboarding/              # Onboarding flow
│   │   ├── OnboardingFlow.tsx   # Main orchestrator (welcome → connection)
│   │   ├── WelcomeStep.tsx      # Animated welcome screen
│   │   └── ConnectionStep.tsx   # Connection configuration
│   │
│   ├── chat/                    # Chat interface
│   │   ├── ChatInterface.tsx    # Main chat container + WebSocket logic
│   │   ├── MessageList.tsx      # Scrollable message list
│   │   ├── MessageBubble.tsx    # Individual message with markdown
│   │   ├── ChatInput.tsx        # Message input field
│   │   └── ConnectionStatus.tsx # Connection indicator
│   │
│   └── layout/
│       └── Container.tsx        # Max-width container
│
├── stores/                       # Zustand state management
│   ├── useConnectionStore.ts    # Connection state & config
│   └── useChatStore.ts          # Messages & typing indicator
│
├── lib/                         # Utilities & helpers
│   ├── utils.ts                # cn() classname merger, formatTime, generateId
│   └── websocket.ts            # WebSocket client class
│
└── types/
    └── index.ts                # TypeScript interfaces
```

---

## 🔄 Application Flow

### 1. Initial Load
```
User opens app
    ↓
page.tsx checks: hasCompletedOnboarding?
    ↓
NO → Show OnboardingFlow
YES → Show ChatInterface
```

### 2. Onboarding Flow
```
WelcomeStep (animated intro)
    ↓ [Get Started]
ConnectionStep (enter API URL & Key)
    ↓ [Connect]
Config saved → hasCompletedOnboarding = true
    ↓
Automatically switches to ChatInterface
```

### 3. Chat Flow
```
ChatInterface mounts
    ↓
Creates WebSocket client
    ↓
Connects to config.apiUrl
    ↓
User types message → ChatInput
    ↓
Message added to useChatStore
    ↓
Sent via WebSocket.sendMessage()
    ↓
Server responds → WebSocket.onMessage
    ↓
Message added to useChatStore
    ↓
MessageList updates with new message
```

---

## 🗂️ State Management (Zustand)

### useConnectionStore
```typescript
{
  isConnected: boolean          // WebSocket connection status
  isConnecting: boolean         // Loading state
  error: string | null          // Error message
  config: {                     // User config
    apiUrl: string
    apiKey?: string
  } | null
  hasCompletedOnboarding: boolean  // Show chat vs onboarding
}
```

### useChatStore
```typescript
{
  messages: Message[]           // All chat messages
  isTyping: boolean            // AI typing indicator
}
```

---

## 🔌 WebSocket Communication

### Client → Server
```json
{
  "type": "message",
  "content": "User's message",
  "timestamp": "2024-02-17T10:30:00.000Z"
}
```

### Server → Client (Expected)
```json
{
  "type": "message",
  "id": "msg-123",
  "content": "AI response",
  "timestamp": "2024-02-17T10:30:01.000Z"
}
```

### Connection Events
- `ws.onopen` → Set isConnected = true
- `ws.onmessage` → Add message to chat
- `ws.onerror` → Set error state
- `ws.onclose` → Attempt reconnection (max 5 times)

---

## 🎨 Component Design Patterns

### 1. Reusable UI Components
All UI components accept:
- `className` prop for customization
- Standard HTML props via spread
- Support for `cn()` utility for class merging

Example:
```typescript
<Button variant="primary" size="lg" className="min-w-[200px]">
  Submit
</Button>
```

### 2. Animation Pattern (Framer Motion)
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### 3. Store Access Pattern
```typescript
const value = useStore((state) => state.value);
const action = useStore((state) => state.action);
```

---

## 🚀 Development Workflow

### Running Locally
```bash
npm run dev       # Start at localhost:3000
npm run build     # Production build
npm start         # Run production server
```

### Adding New Features

#### 1. Add a new UI component
```bash
# Create file
src/components/ui/NewComponent.tsx

# Export and use
import { NewComponent } from '@/components/ui/NewComponent';
```

#### 2. Add new state
```bash
# Update store
src/stores/useConnectionStore.ts

# Add new field + action
newField: value,
setNewField: (val) => set({ newField: val })
```

#### 3. Add new WebSocket event
```typescript
//In ChatInterface.tsx
wsClient.current.onCustomEvent = (data) => {
  // Handle event
};
```

---

## 🎯 Key Features Explained

### 1. Auto-reconnection
WebSocket client automatically reconnects up to 5 times with exponential backoff:
- Attempt 1: 1s delay
- Attempt 2: 2s delay
- Attempt 3: 3s delay
- etc.

### 2. Message Formatting
Uses `react-markdown` + `remark-gfm` for:
- **Bold**, *italic*, ~~strikethrough~~
- `inline code` and code blocks
- Lists, links, tables
- Syntax highlighting ready

### 3. Typing Indicator
When user sends message:
```typescript
setTyping(true) → Shows animated dots
onMessage received → setTyping(false)
```

### 4. Responsive Design
All components use Tailwind responsive classes:
- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+

---

## 🔧 Customization Points

### Colors
Edit Tailwind config or use Tailwind classes:
```typescript
className="bg-blue-600 hover:bg-blue-700"
```

### Animations
Adjust Framer Motion parameters:
```typescript
transition={{ duration: 0.5, delay: 0.2 }}
```

### WebSocket Format
Modify `websocket.ts` to match your API:
```typescript
send(data: any) {
  // Custom serialization
}
```

---

## 📝 Next Steps

1. **Test with your Open Claw instance**
2. **Customize branding** (colors, logo, name)
3. **Add features** (file upload, voice, etc.)
4. **Deploy** (Vercel, Railway, etc.)

---

Built for simplicity, scalability, and beautiful UX! 🚀
