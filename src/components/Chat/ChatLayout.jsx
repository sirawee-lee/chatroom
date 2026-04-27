import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../../firebase/config';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, arrayRemove, deleteDoc, getDocs,
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';
import Chatbot from './Chatbot';
import ToastNotification from './ToastNotification';

function loadLastRead(uid) {
  try { return JSON.parse(localStorage.getItem(`lastRead_${uid}`) || '{}'); } catch { return {}; }
}
function saveLastRead(uid, map) {
  try { localStorage.setItem(`lastRead_${uid}`, JSON.stringify(map)); } catch {}
}

export default function ChatLayout() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [sidebarHidden, setSidebarHidden] = useState(false);

  const activeRoomRef = useRef(null);
  const lastReadRef = useRef({});
  const prevRoomMsgAtRef = useRef({});   // track previous lastMessageAt per room for toast

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Load lastRead from localStorage once on login
  useEffect(() => {
    if (!currentUser) return;
    lastReadRef.current = loadLastRead(currentUser.uid);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chatrooms'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const newRooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Detect new messages for toast (only fires on live updates, not initial load)
      newRooms.forEach(room => {
        const prevMs = prevRoomMsgAtRef.current[room.id];
        const curMs = room.lastMessageAt?.toMillis?.() ?? (room.lastMessageAt?.seconds ?? 0) * 1000;

        if (prevMs !== undefined && curMs > prevMs
          && room.lastMessageSenderId
          && room.lastMessageSenderId !== currentUser.uid
          && activeRoomRef.current?.id !== room.id
        ) {
          setToasts(p => [...p, {
            id: Date.now() + Math.random(),
            roomId: room.id,
            roomName: room.name || 'ChatRoom',
            msg: {
              senderName: room.lastMessageSenderName || '?',
              senderPhoto: room.lastMessageSenderPhoto || null,
              text: room.lastMessage || '',
              type: room.lastMessageType || 'text',
              isUnsent: false,
            },
          }]);
        }
        prevRoomMsgAtRef.current[room.id] = curMs;
      });

      setRooms(newRooms);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  // Compute unreadMap from rooms + localStorage
  // activeRoom is a dependency so badge clears immediately when user opens a room
  const unreadMap = useMemo(() => {
    if (!currentUser) return {};
    const map = {};
    rooms.forEach(room => {
      if (room.id === activeRoom?.id) { map[room.id] = 0; return; }
      if (!room.lastMessageAt || !room.lastMessageSenderId) return;
      if (room.lastMessageSenderId === currentUser.uid) return;

      const lastRead = lastReadRef.current[room.id] || 0;
      const msgMs = room.lastMessageAt?.toMillis?.() ?? (room.lastMessageAt?.seconds ?? 0) * 1000;
      if (msgMs > lastRead) map[room.id] = 1;
    });
    return map;
  }, [rooms, currentUser, activeRoom]);

  const handleSelectRoom = (room) => {
    // Mark room as read
    lastReadRef.current[room.id] = Date.now();
    saveLastRead(currentUser.uid, lastReadRef.current);

    setActiveRoom(room);
    setSidebarHidden(true);
  };

  const handleDeleteRoom = async (roomId) => {
    const roomRef = doc(db, 'chatrooms', roomId);
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    const remaining = (room.members || []).filter(uid => uid !== currentUser.uid);
    if (remaining.length === 0) {
      const msgsSnap = await getDocs(collection(db, 'chatrooms', roomId, 'messages'));
      await Promise.all(msgsSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(roomRef);
    } else {
      await updateDoc(roomRef, { members: arrayRemove(currentUser.uid) });
    }
    if (activeRoomRef.current?.id === roomId) {
      setActiveRoom(null);
      setSidebarHidden(false);
    }
  };

  const handleNewMessage = (roomId, msg) => {
    if (!msg || msg.senderId === currentUser.uid) return;
    if (document.hidden && Notification.permission === 'granted') {
      const room = rooms.find(r => r.id === roomId);
      new Notification(`New message in ${room?.name || 'ChatRoom'}`, {
        body: msg.isUnsent ? 'Message unsent' : (msg.text || (msg.type === 'image' ? '📷 Image' : '🖼️ Sticker')),
        icon: '/favicon.ico',
      });
    }
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const handleToastClick = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) handleSelectRoom(room);
  };

  return (
    <div className="chat-layout">
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        unreadMap={unreadMap}
        onSelectRoom={handleSelectRoom}
        onDeleteRoom={handleDeleteRoom}
        isMobileHidden={sidebarHidden}
      />

      {activeRoom ? (
        <ChatRoom
          key={activeRoom.id}
          room={activeRoom}
          onNewMessage={(msg) => handleNewMessage(activeRoom.id, msg)}
          onBack={() => { setSidebarHidden(false); }}
          onToggleChatbot={() => setShowChatbot(p => !p)}
        />
      ) : (
        <div className="no-room-selected">
          <span>💬</span>
          <h3>Welcome to ChatRoom</h3>
          <p>Select a conversation or create a new one</p>
        </div>
      )}

      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}

      <ToastNotification
        toasts={toasts}
        onDismiss={dismissToast}
        onClickToast={handleToastClick}
      />
    </div>
  );
}
