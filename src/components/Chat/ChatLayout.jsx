import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/config';
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, serverTimestamp, doc, getDoc,
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import ChatRoom from './ChatRoom';
import Chatbot from './Chatbot';

export default function ChatLayout() {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
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

  // Collect unique friends from all rooms
  useEffect(() => {
    if (!rooms.length || !currentUser) return;
    const allUIDs = new Set();
    rooms.forEach(room =>
      (room.members || []).forEach(uid => {
        if (uid !== currentUser.uid) allUIDs.add(uid);
      })
    );
    if (!allUIDs.size) { setFriends([]); return; }
    Promise.all(
      [...allUIDs].map(uid =>
        getDoc(doc(db, 'users', uid)).then(snap =>
          snap.exists() ? { uid, ...snap.data() } : null
        )
      )
    ).then(profiles => setFriends(profiles.filter(Boolean)));
  }, [rooms, currentUser]);

  const handleSelectRoom = (room) => {
    setActiveRoom(room);
    setSidebarHidden(true);
    setUnreadMap(prev => ({ ...prev, [room.id]: 0 }));
    lastSeenRef.current[room.id] = Date.now();
  };

  const handleOpenDM = async (friendUID) => {
    // Find existing 1-on-1 room
    const existing = rooms.find(r =>
      r.members?.length === 2 &&
      r.members.includes(currentUser.uid) &&
      r.members.includes(friendUID)
    );
    if (existing) {
      handleSelectRoom(existing);
      return;
    }
    // Create new DM room
    const friendProfile = friends.find(f => f.uid === friendUID);
    const roomName = friendProfile?.username || friendUID;
    const ref = await addDoc(collection(db, 'chatrooms'), {
      name: roomName,
      members: [currentUser.uid, friendUID],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      createdBy: currentUser.uid,
    });
    handleSelectRoom({ id: ref.id, name: roomName, members: [currentUser.uid, friendUID] });
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
        friends={friends}
        activeRoom={activeRoom}
        unreadMap={unreadMap}
        onSelectRoom={handleSelectRoom}
        onOpenDM={handleOpenDM}
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
