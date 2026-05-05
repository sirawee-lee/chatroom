# ChatRoom — Midterm Project

A real-time chat app built with React + Firebase.

**Live demo:** https://chatroom-6a9a0.web.app/

---

## Features

**Basic**
- Email sign up / sign in + Google OAuth
- Firebase Hosting, Firestore, Storage (all authenticated)
- Responsive layout (mobile + desktop)

**Chatroom**
- Create private or group chatrooms
- Invite members by email (on create or after)
- Real-time messages via Firestore `onSnapshot`
- Full message history on open

**User Profile**
- Edit: profile picture, username, phone, address
- Email shown as read-only (login account)
- Changes sync in real time

**Message Operations**
- Send text, image, GIF (GIPHY), custom drawn sticker
- Unsend / Edit (own messages only)
- Search messages with ▲▼ navigation

**Advanced**
- React 18 + Vite
- CSS animations (message entrance, badge pulse, highlight flash)
- XSS safe — all input rendered as plain text via React JSX
- In-app toast notification (top-right) for unread messages only

**Bonus**
- AI Chatbot (Gemini 3.0 Pro)
- Block user — hides messages in group chat, disables DM
- GIF picker (GIPHY API)
- Emoji reactions on messages (toggle on/off)
- Reply with scroll-to + highlight original
- Custom sticker canvas (colors, brush sizes, eraser)

---

## Local Setup

**Prerequisites:** Node.js v18+, a Firebase project with Auth / Firestore / Storage enabled

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in Firebase keys, VITE_GIPHY_API_KEY, VITE_GEMINI_API_KEY

# 3. Run
npm run dev
# → http://localhost:5173
```

**Firebase Console setup:**
1. Authentication → enable Email/Password and Google
2. Firestore → create database (production mode)
3. Storage → create default bucket
4. Paste `firestore.rules` and `storage.rules` into their respective Rules tabs

---

## How to Use

| Thing | How |
|-------|-----|
| Create room | Click **＋** in sidebar → name + invite by email → Create |
| Invite to existing room | Chat header → 👥 icon → search email → Invite |
| Send message | Type → Enter (Shift+Enter for newline) |
| Send image / GIF / sticker | Toolbar icons in input bar |
| Unsend / Edit / React / Reply | Hover over message → action bar |
| Search | 🔍 in chat header → type keyword → ▲▼ to navigate |
| Block user | 👥 in chat header → member list → Block |
| Unblock | Your avatar (bottom-left) → Blocked tab → Unblock |
| AI Chatbot | 🤖 in chat header |

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## AI Usage

See `AI_reference.pdf` for full documentation of AI-assisted code segments.

This README was reviewed with Gemini 3.0 Pro for grammar, clarity, and to catch any missing details.
