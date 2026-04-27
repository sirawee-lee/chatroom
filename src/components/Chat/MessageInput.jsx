import React, { useState, useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import StickerCanvas from './StickerCanvas';

export default function MessageInput({ replyingTo, onCancelReply, onSendText, onSendImage, onSendGif, onSendSticker }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSendText(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
      // Wait for React to re-enable the textarea before focusing
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    try {
      await onSendImage(file);
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleEmojiSelect = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setShowEmoji(false);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleGifSelect = async (url) => {
    setShowGif(false);
    setSending(true);
    try {
      await onSendGif(url);
    } finally {
      setSending(false);
    }
  };

  const handleStickerSend = async (blob) => {
    setShowSticker(false);
    setSending(true);
    try {
      await onSendSticker(blob);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-input-area">
      {replyingTo && (
        <div className="reply-preview">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="reply-to-name">↩ {replyingTo.senderName}</div>
            <div className="reply-to-text">
              {replyingTo.type !== 'text' ? `[${replyingTo.type}]` : replyingTo.text}
            </div>
          </div>
          <button className="close-reply" onClick={onCancelReply}>✕</button>
        </div>
      )}

      <div className="input-row" style={{ position: 'relative' }}>
        <div className="input-tools">
          <button
            className="btn-icon"
            onClick={() => fileInputRef.current?.click()}
            title="Send image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />

          <button
            className="btn-icon"
            onClick={() => { setShowGif(p => !p); setShowEmoji(false); }}
            title="Send GIF"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="3"/>
              <path d="M7 12h2m-1-1.5v3M12 10v4M16 10h-2v4h2M16 12h-1.5"/>
            </svg>
          </button>

          <button
            className="btn-icon"
            onClick={() => setShowSticker(true)}
            title="Draw sticker"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={sending}
          />

          {showEmoji && (
            <div style={{ position: 'absolute', bottom: '100%', right: 0, zIndex: 100 }}>
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
                align="right"
              />
            </div>
          )}

          {showGif && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 100 }}>
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setShowGif(false)}
              />
            </div>
          )}
        </div>

        <button
          className="btn-icon"
          onClick={() => { setShowEmoji(p => !p); setShowGif(false); }}
          title="Emoji"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>

        <button
          className="btn-send"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          title="Send"
        >
          {sending ? (
            <div className="spinner" style={{ width: 16, height: 16 }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          )}
        </button>
      </div>

      {showSticker && (
        <StickerCanvas
          onSend={handleStickerSend}
          onClose={() => setShowSticker(false)}
        />
      )}
    </div>
  );
}
