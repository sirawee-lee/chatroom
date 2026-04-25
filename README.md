# ChatRoom — Software Studio Midterm Project

A real-time chat application built with React + Firebase. Supports private/group chatrooms, media sharing, emoji reactions, reply threads, custom sticker drawing, AI chatbot, and more.

---

## Features

### Basic
- **Email Sign Up / Sign In** with error handling
- **Google OAuth Sign In**
- **Firebase Hosting** ready (see deploy instructions)
- **Authenticated Firestore read/write** — all data access requires auth
- **Responsive Web Design** — works on mobile, tablet, and desktop
- **Git version control** — committed throughout development

### Chatroom
- Create private or group chatrooms
- Invite members by email (search + add)
- Load full message history (up to 200 messages)
- Real-time message sync via Firestore `onSnapshot`

### User Profile
- Editable: username, phone number, address
- Profile picture upload (stored in Firebase Storage)
- Profile shown next to messages (avatar + name)

### Message Operations
- **Send text messages** (XSS-sanitized before storing)
- **Send images** (uploaded to Firebase Storage, can be unsent)
- **Send GIFs** via Tenor API
- **Unsend messages** (own messages only)
- **Edit messages** (own text messages only, shows "edited" label)
- **Search messages** in current chatroom with prev/next navigation

### Advanced
- **React framework** (Vite + React 18)
- **CSS animations** — message entrance, modal scale, typing dots bounce, notification pulse, emoji hover scale
- **XSS protection** — strips HTML tags and escapes special characters before storing to Firestore
- **Chrome notifications** — notifies on unread messages when the window is in background or a different chatroom is active
- **Block user** — block from member list; blocked user's messages are hidden; direct chat shows "cannot send" overlay

### Bonus
- **Emoji reactions** — hover any message → pick emoji reaction, toggle off by clicking again
- **Reply to specific message** — inline reply quote, preview above input while typing, click to scroll & highlight original
- **GIF picker** — Tenor API integration with search
- **Custom sticker canvas** — draw with multiple colors and brushes, send inline in chat (can be unsent)
- **AI Chatbot** — Gemini-powered assistant panel, persistent conversation context

---

## Local Setup (Step by Step)

### Prerequisites
- Node.js v18+ and npm
- A Firebase project with Firestore, Auth, and Storage enabled

### 1. Clone / extract project

```bash
cd midterm_hw
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then open `.env` and fill in your Firebase credentials (from Firebase Console → Project Settings → General → Your apps):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Optional — needed for GIF picker
VITE_TENOR_API_KEY=...

# Optional — needed for AI chatbot
VITE_GEMINI_API_KEY=...
```

### 4. Set up Firebase project

In Firebase Console:

1. **Authentication** → Sign-in methods → Enable **Email/Password** and **Google**
2. **Firestore Database** → Create database (production mode)
3. **Storage** → Create default bucket
4. **Firestore Rules** → Paste contents of `firestore.rules`
5. **Storage Rules** → Paste contents of `storage.rules`

### 5. Run locally

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## How to Use

### Sign Up / Sign In
- Open the app → choose **Sign Up** tab → enter email + password → click **Create Account**
- Or click **Continue with Google**
- To sign in, use the **Sign In** tab

### Creating a Chatroom
- Click **+** button in the sidebar header
- Enter a room name
- Search for members by email and click **Add**
- Click **Create Room**

### Chatting
- Select a room from the sidebar
- Type a message and press **Enter** (Shift+Enter for newline)
- Use toolbar buttons for: Image 📷 | GIF | Draw Sticker ✏️ | Emoji 😊

### Message Actions (hover over a message)
- **Quick reaction** — click any emoji in the hover bar
- **Reply** — click the reply icon; the quoted message appears above input
- **Edit** (own messages only) — click pencil icon; press Enter to save, Escape to cancel
- **Unsend** (own messages only) — click trash icon; message shows as "Message unsent"

### Reply Thread
- When you reply to a message, the quote appears above your message bubble
- Click the quote to **scroll to and highlight** the original message

### Profile
- Click your avatar in the bottom-left of the sidebar
- Edit username, phone, address; click avatar to upload a photo
- **Blocked** tab shows all blocked users (click Unblock to restore)

### Block User
- Open a chatroom → click 👥 invite icon → see member list → click **Block** next to any member
- Blocked user's messages are hidden in group chats
- In a 2-person chat, an overlay appears saying messaging is disabled

### Search Messages
- Click 🔍 in the chat header
- Type a keyword; results are highlighted
- Use ▲▼ to navigate between matches

### GIF Picker
- Click the GIF icon in the input toolbar
- Trending GIFs load automatically; use the search box to find specific ones
- Click a GIF to send it

### Custom Sticker
- Click ✏️ (draw sticker) in the input toolbar
- Choose color and brush type
- Draw on the canvas; use **Undo** or **Clear** as needed
- Click **Send Sticker** — the sticker is uploaded and appears in chat
- Hover the sticker → Unsend to remove it (own stickers only)

### AI Chatbot
- Click 🤖 in the chat header to open the AI assistant panel
- Type any question and press Enter
- The chatbot maintains conversation context within the session

---

## Deploy to Firebase Hosting

```bash
# Build production bundle
npm run build

# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Initialize (first time only — select Hosting, use 'dist' as public dir)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

---

## Project Structure

```
src/
├── components/
│   ├── Auth/       AuthPage.jsx
│   ├── Chat/       ChatLayout, Sidebar, ChatRoom, MessageItem,
│   │               MessageInput, EmojiPicker, GifPicker,
│   │               StickerCanvas, Chatbot
│   ├── Modals/     CreateRoomModal, InviteMemberModal
│   └── Profile/    ProfileModal
├── contexts/       AuthContext.jsx
├── firebase/       config.js
└── utils/          sanitize.js
```

---

## AI Usage

See `AI_reference.pdf` in the project root for documentation of AI tool usage during development.
