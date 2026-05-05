# ChatRoom — Software Studio Midterm Project

A real-time chat web application built with **React (Vite)** and **Firebase**.  
Supports private and group chatrooms, media sharing, emoji reactions, reply threads, custom drawn stickers, an AI chatbot, and more.

**Live demo:** [https://chatroom-midterm.web.app](https://chatroom-midterm.web.app)

---

## Table of Contents

1. [Features](#features)
2. [Local Setup (Step by Step)](#local-setup-step-by-step)
3. [How to Use](#how-to-use)
4. [Deploy to Firebase Hosting](#deploy-to-firebase-hosting)
5. [Project Structure](#project-structure)
6. [AI Usage](#ai-usage)

---

## Features

### Basic Components

| Feature | Details |
|---------|---------|
| **Email Sign Up** | Register with email + password |
| **Email Sign In** | Log in with existing account |
| **Google Sign In** | One-click OAuth via Google |
| **Firebase Hosting** | Deployed and accessible online |
| **Authenticated DB access** | All Firestore and Storage reads/writes require a valid login |
| **Responsive Web Design** | Layout adapts to mobile, tablet, and desktop using `100dvh` and CSS flexbox — no horizontal scrolling |
| **Git version control** | Committed regularly throughout development |

### Chatroom

- **Create private or group chatrooms** — set a name, search members by email, then create
- **Invite more members** — add people to an existing room from the chat header
- **Real-time messages** — powered by Firestore `onSnapshot`; all participants see messages instantly
- **Full message history** — loads all previous messages when you open a room

### User Profile

- **Editable fields:** profile picture, username, phone number (optional), address (optional)
- **Email** — displayed as read-only (tied to the login account, cannot be changed)
- **Profile picture upload** — stored in Firebase Storage
- **Live sync** — profile changes propagate in real time via `onSnapshot`
- **Avatar + name** shown next to every message

### Message Operations

| Operation | Who can use it |
|-----------|---------------|
| Send text | All members |
| Send image | All members (stored in Firebase Storage) |
| Send GIF | All members (via GIPHY API) |
| Send custom sticker | All members (drawn canvas, uploaded as PNG) |
| **Unsend** message | Own messages only |
| **Edit** message | Own text messages only (shows "edited" label) |
| **Search** messages | All members — search bar in chat header with ▲▼ navigation |
| **Unsend image / sticker** | Own media only |

### Advanced Components

- **React 18 + Vite** — component-based SPA framework
- **CSS animations** — message entrance slide, modal scale-in, unread badge pulse, reply highlight flash
- **XSS protection** — user input is stored as plain text and rendered with React's JSX (never `dangerouslySetInnerHTML`), preventing script injection and HTML tag rendering
- **Chrome notifications** — in-app toast (top-right) appears when a new message arrives in a room you are not currently viewing; only fires for unread messages, not all messages

### Bonus Components

| Feature | Details |
|---------|---------|
| **AI Chatbot** | Gemini 3.0 Pro API, persistent multi-turn conversation per session |
| **Block User** | Block from member list popup; blocked user's messages hidden in group chat; direct chat shows a "cannot send" overlay with reason |
| **GIF Picker** | GIPHY API with live search + trending fallback |
| **Emoji Reactions** | Hover any message → quick-pick bar (❤️😂😮😢😡👍) or full emoji picker; reactions stored per-user in Firestore; click again to remove |
| **Reply to message** | Inline quote above your bubble; preview shown above input while typing; click quote to scroll to and flash-highlight original |
| **Custom Sticker** | Draw on a canvas overlay (multiple colors + brush sizes + eraser); send as PNG inline in chat; can be unsent |

---

## Local Setup (Step by Step)

### Prerequisites

- **Node.js v18+** and **npm** — [https://nodejs.org](https://nodejs.org)
- A **Firebase project** with Firestore, Authentication, and Storage enabled

---

### Step 1 — Extract / enter the project folder

```bash
cd midterm_hw
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Open `.env.local` and add your values:

```
# Firebase (Firebase Console → Project Settings → Your apps)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# GIPHY developer key — https://developers.giphy.com
VITE_GIPHY_API_KEY=...

# Google Gemini API key — https://aistudio.google.com
VITE_GEMINI_API_KEY=...
```

> **Note:** If `VITE_GIPHY_API_KEY` is missing, the GIF picker will show a "no API key" message.  
> If `VITE_GEMINI_API_KEY` is missing, the chatbot will display an error when sending messages.

---

### Step 4 — Set up Firebase project

In the **Firebase Console** ([console.firebase.google.com](https://console.firebase.google.com)):

1. **Authentication → Sign-in method** → Enable **Email/Password** and **Google**
2. **Firestore Database** → Create database → start in **production mode**
3. **Storage** → Get started → create default bucket
4. **Firestore Rules** → Replace the default rules with the contents of `firestore.rules`
5. **Storage Rules** → Replace the default rules with the contents of `storage.rules`

---

### Step 5 — Run locally

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## How to Use

### Sign Up / Sign In

1. Open the app — you see the Auth screen
2. **Sign Up tab** → enter email + password → click **Create Account**
3. **Sign In tab** → enter existing credentials → click **Sign In**
4. Or click **Continue with Google** on either tab for one-click login

---

### Creating a Chatroom

1. Click the **＋** button in the top-right of the sidebar
2. Enter a **room name**
3. In the "Add members" field, type an email → press **Enter** or click **Add** → repeat for more members
4. Click **Create Room** — the new room appears in the sidebar and opens automatically

---

### Sending Messages

| Action | How |
|--------|-----|
| Send text | Type in the input bar → **Enter** to send (Shift+Enter for a new line) |
| Send image | Click 📷 icon → choose a file |
| Send GIF | Click **GIF** icon → search or browse trending → click to send |
| Send sticker | Click ✏️ icon → draw on canvas → **Send Sticker** |
| Send emoji in text | Click 😊 icon → pick emoji → it inserts at cursor position |

---

### Message Actions

Hover over any message to reveal the action bar:

| Action | Icon | Who |
|--------|------|-----|
| **Emoji reaction** | 😊 (quick bar + full picker) | Everyone |
| **Reply** | ↩ | Everyone |
| **Edit** | ✏️ | Own messages only |
| **Unsend** | 🗑 | Own messages only |

- **Edit:** click ✏️ → text becomes editable inline → press **Enter** to save, **Escape** to cancel → message shows *(edited)*
- **Unsend:** click 🗑 → message shows *"Message unsent"* to all participants
- **React:** click emoji in the quick bar or open the picker; your reaction appears below the bubble; click it again to remove
- **Reply:** click ↩ → a preview of the original message appears above the input box → type your reply → send → the reply quote appears above your bubble

---

### Reply — Scroll & Highlight

- When a reply quote is shown inside a message bubble, **click the quote** to:
  1. Scroll the chat to the original message
  2. Flash-highlight it in purple for ~1.4 seconds

---

### Search Messages

1. Click 🔍 in the chat header
2. A search bar slides in — type a keyword
3. Matching messages are highlighted; the counter shows **1/N**
4. Press **▲** / **▼** (or the arrow buttons) to jump between results
5. Click 🔍 again to close and clear

---

### Invite Members to an Existing Room

1. Open the room → click the **👥 person+** icon in the chat header
2. Search by email → click **Invite** next to the result
3. The new member sees the room in their sidebar immediately

---

### User Profile

1. Click your **avatar** in the bottom-left corner of the sidebar
2. Edit any of: **username**, **phone number** (optional), **address** (optional)
3. Click the avatar image to **upload a new profile picture**
4. Click **Save Changes** — updates appear in real time everywhere
5. **Email** is shown as read-only (it is your login email and cannot be changed here)

---

### Block a User

1. In a chatroom, click the **👥 invite** icon in the header
2. In the member list popup, click **Block** next to any user
3. Effects:
   - Their messages are hidden from your view in all shared group chats
   - In a 2-person (direct) chat, the input is replaced with a "cannot send messages" overlay
   - The overlay states the reason: *(You blocked this user)* or *(You have been blocked by this user)*
4. To **unblock**: open your profile (bottom-left avatar) → **Blocked Users** tab → click **Unblock**

---

### GIF Picker

1. Click the **GIF** button in the input toolbar
2. Trending GIFs load automatically
3. Type in the search box to find specific GIFs
4. Click any GIF to send it instantly
5. To unsend: hover the GIF bubble → click 🗑

---

### Custom Sticker Canvas

1. Click ✏️ in the input toolbar — the canvas panel opens
2. **Choose a color** from the palette (or use the custom color picker)
3. **Choose a brush**: pen (thin), marker (medium), brush (thick), or eraser
4. Draw freely on the canvas
5. Click **Clear** to reset, or **Send Sticker** to upload and send
6. The sticker appears in chat at the drawn position
7. To unsend: hover the sticker → click 🗑

---

### AI Chatbot

1. Open any chatroom → click 🤖 in the chat header to open the assistant panel
2. Type a question and press **Enter**
3. The bot maintains conversation context within the session (multi-turn)
4. Click 🤖 again to close the panel

---

### Notifications

- When a new message arrives in a room **you are not currently viewing**, a toast notification pops up in the **top-right corner**
- Click the toast to navigate to that room
- Click **✕** on the toast to dismiss it

---

## Deploy to Firebase Hosting

```bash
# 1 — Build the production bundle
npm run build

# 2 — Install Firebase CLI (skip if already installed)
npm install -g firebase-tools

# 3 — Log in
firebase login

# 4 — First-time init (select Hosting, public dir = dist, single-page app = yes)
firebase init hosting

# 5 — Deploy
firebase deploy --only hosting
```

The live URL is printed in the terminal after deployment.

---

## Project Structure

```
midterm_hw/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   └── AuthPage.jsx          # Email + Google sign-in/up
│   │   ├── Chat/
│   │   │   ├── ChatLayout.jsx        # Root layout, room list, toast logic
│   │   │   ├── Sidebar.jsx           # Room list + unread badges
│   │   │   ├── ChatRoom.jsx          # Active chat, search, block, invite
│   │   │   ├── MessageItem.jsx       # Single message bubble + reactions
│   │   │   ├── MessageInput.jsx      # Input bar, reply preview
│   │   │   ├── EmojiPicker.jsx       # Emoji grid picker
│   │   │   ├── GifPicker.jsx         # GIPHY search picker
│   │   │   ├── StickerCanvas.jsx     # Drawing canvas
│   │   │   ├── Chatbot.jsx           # Gemini AI panel
│   │   │   └── ToastNotification.jsx # Top-right toast stack
│   │   ├── Modals/
│   │   │   ├── CreateRoomModal.jsx   # New room form
│   │   │   └── InviteMemberModal.jsx # Add member to existing room
│   │   └── Profile/
│   │       ├── ProfileModal.jsx      # Own profile editor
│   │       └── UserProfilePopup.jsx  # Other user's profile + block button
│   ├── contexts/
│   │   └── AuthContext.jsx           # Auth state + real-time userProfile
│   ├── firebase/
│   │   └── config.js                 # Firebase init
│   ├── utils/
│   │   └── sanitize.js               # XSS input sanitizer
│   ├── App.css                       # All component styles
│   └── index.css                     # Global layout + keyframes
├── firestore.rules                   # Firestore security rules
├── storage.rules                     # Storage security rules
├── firebase.json                     # Firebase hosting config
├── .env.example                      # Environment variable template
├── AI_reference.pdf                  # AI tool usage documentation
└── AI_reference.docx                 # AI tool usage documentation (Word)
```

---

## AI Usage

AI tools (Gemini 3.0 Pro) were used during development for specific complex subsystems.  
Full documentation of every AI-assisted segment — including exact prompts, AI responses, and modifications made — is in **`AI_reference.pdf`** (and `AI_reference.docx`) at the project root.
