import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage } from '../../firebase/config';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  updateDoc, doc, serverTimestamp, limit, getDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';
import { stripHtml } from '../../utils/sanitize';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import InviteMemberModal from '../Modals/InviteMemberModal';
import UserProfilePopup from '../Profile/UserProfilePopup';
import ProfileModal from '../Profile/ProfileModal';

export default function ChatRoom({ room, onNewMessage, onBack, onToggleChatbot }) {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [popupUID, setPopupUID] = useState(null);
  const [showOwnProfile, setShowOwnProfile] = useState(false);
  const [searchIdx, setSearchIdx] = useState(0);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const prevMsgCount = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!room) return;
    const loadMembers = async () => {
      const data = await Promise.all(
        room.members.map(uid => getDoc(doc(db, 'users', uid)))
      );
      setMembers(data.map(d => ({ id: d.id, ...d.data() })).filter(d => d.uid));
    };
    loadMembers();
  }, [room]);

  useEffect(() => {
    if (!room) return;
    isFirstLoad.current = true;

    const q = query(
      collection(db, 'chatrooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (!isFirstLoad.current && msgs.length > prevMsgCount.current) {
        const newest = msgs[msgs.length - 1];
        if (newest && newest.senderId !== currentUser.uid) {
          onNewMessage?.(newest);
        }
      }

      prevMsgCount.current = msgs.length;
      isFirstLoad.current = false;
      setMessages(msgs);
    });

    return unsub;
  }, [room, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToMessage = useCallback((msgId) => {
    const el = messageRefs.current[msgId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('highlight-flash');
    setTimeout(() => el.classList.remove('highlight-flash'), 1400);
  }, []);

  const sendMessage = async ({ text, type = 'text', mediaURL = null }) => {
    const clean = stripHtml(text || '');
    if (!clean && !mediaURL) return;

    const senderProfile = userProfile;
    const msgData = {
      senderId: currentUser.uid,
      senderName: senderProfile?.username || currentUser.email,
      senderPhoto: senderProfile?.photoURL || null,
      text: clean,
      type,
      mediaURL: mediaURL || null,
      timestamp: serverTimestamp(),
      isUnsent: false,
      editedAt: null,
      replyTo: replyingTo
        ? {
            messageId: replyingTo.id,
            text: replyingTo.text || '',
            senderName: replyingTo.senderName,
            type: replyingTo.type,
          }
        : null,
      reactions: {},
    };

    await addDoc(collection(db, 'chatrooms', room.id, 'messages'), msgData);
    await updateDoc(doc(db, 'chatrooms', room.id), {
      lastMessage: type === 'text' ? (clean || '') : `[${type}]`,
      lastMessageAt: serverTimestamp(),
    });
    setReplyingTo(null);
  };

  const unsendMessage = async (msgId) => {
    await updateDoc(doc(db, 'chatrooms', room.id, 'messages', msgId), {
      isUnsent: true,
      text: '',
      mediaURL: null,
    });
  };

  const editMessage = async (msgId, newText) => {
    const clean = stripHtml(newText);
    if (!clean) return;
    await updateDoc(doc(db, 'chatrooms', room.id, 'messages', msgId), {
      text: clean,
      editedAt: serverTimestamp(),
    });
    setEditingId(null);
  };

  const toggleReaction = async (msgId, emoji) => {
    const uid = currentUser.uid;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const existing = msg.reactions?.[emoji] || [];
    const hasReacted = existing.includes(uid);
    await updateDoc(doc(db, 'chatrooms', room.id, 'messages', msgId), {
      [`reactions.${emoji}`]: hasReacted ? arrayRemove(uid) : arrayUnion(uid),
    });
  };

  const uploadAndSend = async (file, type = 'image') => {
    const path = `chatImages/${room.id}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await sendMessage({ text: '', type, mediaURL: url });
  };

  const uploadSticker = async (blob) => {
    const path = `stickers/${room.id}/${Date.now()}.png`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await sendMessage({ text: '', type: 'sticker', mediaURL: url });
  };

  const blockedUsers = userProfile?.blockedUsers || [];
  const visibleMessages = messages.filter(m => !blockedUsers.includes(m.senderId));

  const searchResults = showSearch && searchQuery
    ? visibleMessages.filter(m => !m.isUnsent && m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const isBlockedByMember = members.some(m =>
    m.uid !== currentUser.uid && (m.blockedUsers || []).includes(currentUser.uid)
  );
  const iBlockedMember = members.some(m =>
    m.uid !== currentUser.uid && blockedUsers.includes(m.uid)
  );
  const isDirectBlocked = room.members.length === 2 && (isBlockedByMember || iBlockedMember);

  const getMemberInfo = (uid) => members.find(m => m.uid === uid);

  const handleAvatarClick = (uid) => {
    if (uid === currentUser.uid) {
      setShowOwnProfile(true);
    } else {
      setPopupUID(uid);
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <button className="btn-back-mobile" onClick={onBack}>← Back</button>
        <div className="room-title">
          <h2>{room.name}</h2>
          <p>{room.members.length} member{room.members.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="chat-header-actions">
          <button className="btn-icon" onClick={() => { setShowSearch(p => !p); setSearchQuery(''); }} title="Search messages">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button className="btn-icon" onClick={() => setShowInvite(true)} title="Invite member">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </button>
          <button className="btn-icon" onClick={onToggleChatbot} title="AI Chatbot">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="3" width="18" height="14" rx="2"/>
              <path d="M8 17l-1 4M16 17l1 4M9 21h6"/>
              <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-bar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search in conversation…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchIdx(0); }}
          />
          {searchResults.length > 0 && (
            <>
              <span className="search-results-info">{searchIdx + 1}/{searchResults.length}</span>
              <button className="btn-icon" onClick={() => {
                const next = (searchIdx - 1 + searchResults.length) % searchResults.length;
                setSearchIdx(next);
                scrollToMessage(searchResults[next].id);
              }}>▲</button>
              <button className="btn-icon" onClick={() => {
                const next = (searchIdx + 1) % searchResults.length;
                setSearchIdx(next);
                scrollToMessage(searchResults[next].id);
              }}>▼</button>
            </>
          )}
          {searchQuery && searchResults.length === 0 && (
            <span className="search-results-info">No results</span>
          )}
        </div>
      )}

      <div className="messages-area">
        {visibleMessages.length === 0 ? (
          <div className="empty-chat">
            <span>👋</span>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          visibleMessages.map((msg, idx) => {
            const prevMsg = visibleMessages[idx - 1];
            const showDateSep = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
            return (
              <React.Fragment key={msg.id}>
                {showDateSep && msg.timestamp && (
                  <div className="messages-date-sep">
                    {formatDate(msg.timestamp)}
                  </div>
                )}
                <MessageItem
                  ref={el => { if (el) messageRefs.current[msg.id] = el; }}
                  message={msg}
                  isOwn={msg.senderId === currentUser.uid}
                  isSearchMatch={searchResults.some(r => r.id === msg.id)}
                  onReply={() => setReplyingTo(msg)}
                  onUnsend={() => unsendMessage(msg.id)}
                  onEdit={() => setEditingId(msg.id)}
                  isEditing={editingId === msg.id}
                  onSaveEdit={(text) => editMessage(msg.id, text)}
                  onCancelEdit={() => setEditingId(null)}
                  onReact={(emoji) => toggleReaction(msg.id, emoji)}
                  onClickReply={() => msg.replyTo && scrollToMessage(msg.replyTo.messageId)}
                  onAvatarClick={handleAvatarClick}
                  currentUserId={currentUser.uid}
                  getMemberInfo={getMemberInfo}
                />
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isDirectBlocked ? (
        <div className="blocked-overlay">
          🚫 You cannot send messages in this conversation.
          {iBlockedMember && ' (You blocked this user)'}
          {isBlockedByMember && !iBlockedMember && ' (You have been blocked by this user)'}
        </div>
      ) : (
        <MessageInput
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          onSendText={(text) => sendMessage({ text, type: 'text' })}
          onSendImage={(file) => uploadAndSend(file, 'image')}
          onSendGif={(url) => sendMessage({ text: '', type: 'gif', mediaURL: url })}
          onSendSticker={(blob) => uploadSticker(blob)}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          room={room}
          currentMembers={members}
          onClose={() => setShowInvite(false)}
        />
      )}
      {popupUID && (
        <UserProfilePopup uid={popupUID} onClose={() => setPopupUID(null)} />
      )}
      {showOwnProfile && (
        <ProfileModal onClose={() => setShowOwnProfile(false)} />
      )}
    </div>
  );
}

function isSameDay(ts1, ts2) {
  if (!ts1 || !ts2) return false;
  const d1 = ts1.toDate ? ts1.toDate() : new Date(ts1);
  const d2 = ts2.toDate ? ts2.toDate() : new Date(ts2);
  return d1.toDateString() === d2.toDateString();
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.toDateString() === now.toDateString()) return 'Today';
  if (diff < 172800000) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
