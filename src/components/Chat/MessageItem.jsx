import React, { useState, forwardRef } from 'react';
import EmojiPicker from './EmojiPicker';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const MessageItem = forwardRef(function MessageItem({
  message,
  isOwn,
  isSearchMatch,
  onReply,
  onUnsend,
  onEdit,
  isEditing,
  onSaveEdit,
  onCancelEdit,
  onReact,
  onClickReply,
  currentUserId,
}, ref) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit(editText); }
    if (e.key === 'Escape') onCancelEdit();
  };

  const totalReactions = Object.entries(message.reactions || {})
    .filter(([, uids]) => uids.length > 0);

  return (
    <div
      ref={ref}
      className={`msg-wrapper ${isOwn ? 'own' : 'other'} ${isSearchMatch ? 'highlight-flash' : ''}`}
    >
      {message.replyTo && (
        <div className="reply-quote" onClick={onClickReply} style={{ maxWidth: '70%' }}>
          <div className="reply-sender">{message.replyTo.senderName}</div>
          <div className="reply-text">
            {message.replyTo.type !== 'text' ? `[${message.replyTo.type}]` : message.replyTo.text}
          </div>
        </div>
      )}

      <div className={`msg-group ${isOwn ? 'msg-enter-own' : 'msg-enter'}`}>
        {!isOwn && (
          <div className="msg-avatar">
            {message.senderPhoto
              ? <img src={message.senderPhoto} alt="" />
              : (message.senderName || '?')[0].toUpperCase()}
          </div>
        )}

        <div className="msg-content">
          {!isOwn && (
            <div className="msg-sender-name">{message.senderName}</div>
          )}

          <div className="msg-bubble-wrap" style={{ position: 'relative' }}>
            {/* Hover toolbar */}
            {!message.isUnsent && (
              <div className="msg-hover-bar">
                {QUICK_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className="msg-toolbar-btn"
                    onClick={() => onReact(emoji)}
                    title={`React with ${emoji}`}
                  >{emoji}</button>
                ))}
                <button
                  className="msg-toolbar-btn"
                  onClick={() => setShowEmojiPicker(p => !p)}
                  title="More reactions"
                >+</button>
                <button className="msg-toolbar-btn" onClick={onReply} title="Reply">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 14 4 9 9 4"/>
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
                  </svg>
                </button>
                {isOwn && (
                  <>
                    {message.type === 'text' && (
                      <button className="msg-toolbar-btn" onClick={onEdit} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    <button className="msg-toolbar-btn danger" onClick={onUnsend} title="Unsend">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </>
                )}

                {showEmojiPicker && (
                  <div style={{ position: 'absolute', top: '100%', [isOwn ? 'right' : 'left']: 0, zIndex: 200 }}>
                    <EmojiPicker
                      onSelect={(emoji) => { onReact(emoji); setShowEmojiPicker(false); }}
                      onClose={() => setShowEmojiPicker(false)}
                      align={isOwn ? 'right' : 'left'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Message bubble */}
            {isEditing ? (
              <div>
                <textarea
                  className="msg-edit-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  autoFocus
                  rows={2}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                  <button onClick={onCancelEdit} className="btn-secondary" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>Cancel</button>
                  <button onClick={() => onSaveEdit(editText)} className="btn-save" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>Save</button>
                </div>
              </div>
            ) : (
              <div className={`msg-bubble${message.isUnsent ? ' unsent' : ''}`}>
                {message.isUnsent ? (
                  <span>Message unsent</span>
                ) : message.type === 'image' && message.mediaURL ? (
                  <img
                    className="msg-image"
                    src={message.mediaURL}
                    alt="shared"
                    loading="lazy"
                    onClick={() => window.open(message.mediaURL, '_blank')}
                  />
                ) : message.type === 'gif' && message.mediaURL ? (
                  <img className="msg-gif" src={message.mediaURL} alt="gif" loading="lazy" />
                ) : message.type === 'sticker' && message.mediaURL ? (
                  <img className="msg-sticker" src={message.mediaURL} alt="sticker" loading="lazy" />
                ) : (
                  <span>{message.text}</span>
                )}
              </div>
            )}
          </div>

          {totalReactions.length > 0 && (
            <div className="msg-reactions">
              {totalReactions.map(([emoji, uids]) => (
                <button
                  key={emoji}
                  className={`reaction-chip${uids.includes(currentUserId) ? ' reacted' : ''}`}
                  onClick={() => onReact(emoji)}
                  title={`${uids.length} reaction${uids.length !== 1 ? 's' : ''}`}
                >
                  {emoji} <span className="reaction-count">{uids.length}</span>
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="msg-time">{formatTime(message.timestamp)}</span>
            {message.editedAt && !message.isUnsent && (
              <span className="msg-edited">edited</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default MessageItem;
