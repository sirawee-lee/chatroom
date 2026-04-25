# AI Reference — ChatRoom Midterm Project

**Student ID:** 110006226  
**Tool Used:** ChatGPT (GPT-4o)

---

## Use Case 1 — CSS Design & Visual Improvement

**Location:** `src/App.css`, lines 1–120 (color palette, animation keyframes, button styling)

**Prompt used:**
> "I have a dark-themed chat app with basic CSS. Can you suggest a modern color palette and add smooth CSS animations for message entrance, modal pop-in, and an unread badge pulse effect? I want something that looks like Discord or Messenger."

**AI Output (summarized):**
The AI suggested a purple-toned dark palette with `--accent: #7c6cf2` and provided keyframes for `fadeSlideUp`, `scaleIn`, and `pulse`. It also suggested gradient buttons using `linear-gradient(135deg, ...)`.

**My Refinements:**
- Adjusted the gradient angle from `145deg` to `135deg` for a more balanced look on small buttons
- Replaced the AI's `transform: scale(1.15)` on emoji hover with `scale(1.2)` — it looked too subtle at 1.15 on Retina displays
- Removed the proposed `letter-spacing` on headings; it didn't fit the compact chat UI
- Reorganized the CSS into logical sections (Auth, Sidebar, ChatRoom, MessageItem, etc.) rather than the flat order the AI returned
- Added `@media (max-width: 480px)` rules manually since the AI only covered `768px` breakpoint

---

## Use Case 2 — Code Cleanup & Refactoring

**Location:** `src/components/Chat/ChatRoom.jsx`, lines 40–90 (message subscription + notification logic)

**Prompt used:**
> "Here is my Firestore onSnapshot listener. It works but feels messy — the unread tracking and notification logic are mixed in with the message state update. Can you refactor it so the concerns are separated and the code is easier to read?"

**Original code (before AI):**
```js
onSnapshot(q, (snap) => {
  const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setMessages(msgs);
  if (!isFirst) {
    const last = msgs[msgs.length - 1];
    if (last && last.senderId !== uid && (activeId !== roomId || document.hidden)) {
      setUnread(prev => ({...prev, [roomId]: (prev[roomId]||0)+1}));
      if (Notification.permission === 'granted') { new Notification(...) }
    }
  }
  isFirst = false;
});
```

**AI Output:**
Suggested extracting the notification side-effect into a separate `handleNewMessage` callback passed as a prop, and using a `prevMsgCount` ref to detect new messages rather than an `isFirst` flag.

**My Refinements:**
- Kept the `isFirstLoad` ref approach but renamed it from `isInitial` to `isFirstLoad` for clarity
- The AI placed `prevMsgCount.current = msgs.length` after the notification check; I moved it before to avoid off-by-one when multiple messages arrive at once
- Added a guard `if (!msg || msg.senderId === currentUser.uid) return;` inside `handleNewMessage` in `ChatLayout.jsx` since the AI left that validation out
- Changed `onNewMessage?.()` call site to pass the full `msg` object instead of just `roomId + text`

---

## Use Case 3 — Bug Fixes

### Bug A — Double HTML encoding in sanitize.js

**Location:** `src/utils/sanitize.js`, lines 1–20

**Description:**  
During testing, I noticed that messages containing `&` (e.g., "A & B") were being stored as `&amp;` in Firestore, and when re-rendered they appeared as `&amp;amp;` — a classic double-encoding bug. The original order of replacements ran `<` and `>` first, then `&`, which caused the `&lt;` and `&gt;` insertions to have their own `&` re-escaped on the second pass.

**Prompt used:**
> "My sanitize function is double-encoding ampersands when the input already contains < or >. The output `&lt;` becomes `&amp;lt;` on render. What's wrong?"

**AI Response:**
Identified that `&` must be replaced *first* before any other character, otherwise the replacement strings themselves (`&lt;`, `&gt;`, etc.) get their `&` re-escaped in a subsequent pass.

**My Fix (final code):**
```js
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')   // must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

**Note:** Since React renders text nodes safely by default, `sanitizeText` is used when constructing string snippets (reply previews, search result labels) that might be interpolated into attribute values.

---

### Bug B — Sticker canvas coordinate mismatch on high-DPI screens

**Location:** `src/components/Chat/StickerCanvas.jsx`, `getPos()` function

**Description:**  
On MacBook Retina displays, drawn strokes appeared offset from where the cursor actually was. The canvas was styled at `340×240 px` in CSS but its actual pixel buffer was also `340×240`, so on a 2× screen the coordinate system was halved. Strokes appeared in the bottom-right quadrant relative to the actual touch/mouse position.

**Prompt used:**
> "My canvas drawing is offset on Retina screens. I style the canvas at 340px wide, set width/height attributes to 340 as well, and compute mouse position with getBoundingClientRect. What am I missing?"

**AI Response:**
Explained that `getBoundingClientRect()` returns CSS pixels, and if the canvas's CSS size differs from its attribute size (e.g., styled smaller via CSS), a scale correction is needed: `scaleX = canvas.width / rect.width`.

**My Fix:**
```js
const getPos = (e) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  ...
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
};
```

The scale correction ensures the logical canvas coordinates always match the drawn position regardless of CSS scaling or device pixel ratio. This fix is already applied in the final `StickerCanvas.jsx`.

---

*Screenshots of the actual ChatGPT conversations are available upon request.*
