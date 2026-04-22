import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';
import Chatbot from './Chatbot';

export default function ChatLayout() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const lastSeenRef = useRef({});

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatrooms'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [currentUser]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setSidebarHidden(true);
    setUnreadMap(prev => ({ ...prev, [room.id]: 0 }));
    lastSeenRef.current[room.id] = Date.now();
  };

  const handleNewMessage = (roomId, msg) => {
    if (!msg || msg.senderId === currentUser.uid) return;
    const isActive = activeRoom?.id === roomId;
    const isHidden = document.hidden;

    if (!isActive || isHidden) {
      setUnreadMap(prev => ({
        ...prev,
        [roomId]: (prev[roomId] || 0) + 1,
      }));

      if (Notification.permission === 'granted') {
        const room = rooms.find(r => r.id === roomId);
        new Notification(`New message in ${room?.name || 'ChatRoom'}`, {
          body: msg.isUnsent ? 'Message unsent' : (msg.text || (msg.type === 'image' ? '📷 Image' : '🖼️ Sticker')),
          icon: '/favicon.ico',
        });
      }
    }
  };

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="chat-layout">
      <Sidebar
        rooms={rooms}
        activeRoom={activeRoom}
        unreadMap={unreadMap}
        onSelectRoom={handleSelectRoom}
        isMobileHidden={sidebarHidden}
      />

      {activeRoom ? (
        <ChatRoom
          key={activeRoom.id}
          room={activeRoom}
          onNewMessage={(msg) => handleNewMessage(activeRoom.id, msg)}
          onBack={() => setSidebarHidden(false)}
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
    </div>
  );
}
