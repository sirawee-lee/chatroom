import React, { useEffect } from 'react';

export default function ToastNotification({ toasts, onDismiss, onClickToast }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} onClickToast={onClickToast} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss, onClickToast }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  const preview = toast.msg.isUnsent
    ? 'Message unsent'
    : toast.msg.type === 'image' ? '📷 Image'
    : toast.msg.type === 'gif' ? '🎞️ GIF'
    : toast.msg.type === 'sticker' ? '🖼️ Sticker'
    : toast.msg.text || '';

  return (
    <div
      className="toast-item"
      onClick={() => { onClickToast(toast.roomId); onDismiss(toast.id); }}
    >
      <div className="toast-avatar">
        {toast.msg.senderPhoto
          ? <img src={toast.msg.senderPhoto} alt="" />
          : (toast.msg.senderName || '?')[0].toUpperCase()}
      </div>
      <div className="toast-body">
        <div className="toast-room">{toast.roomName}</div>
        <div className="toast-sender">{toast.msg.senderName}</div>
        <div className="toast-preview">{preview}</div>
      </div>
      <button
        className="toast-close"
        onClick={e => { e.stopPropagation(); onDismiss(toast.id); }}
      >✕</button>
    </div>
  );
}
