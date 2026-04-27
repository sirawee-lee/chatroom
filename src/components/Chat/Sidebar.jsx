import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import CreateRoomModal from '../Modals/CreateRoomModal';
import ProfileModal from '../Profile/ProfileModal';
import UserProfilePopup from '../Profile/UserProfilePopup';

export default function Sidebar({ rooms, activeRoom, unreadMap, onSelectRoom, onOpenDM, onDeleteRoom, friends, isMobileHidden }) {
  const { userProfile } = useAuth();
  const [tab, setTab] = useState('chats');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [popupUID, setPopupUID] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!confirmDeleteId) return;
    const handleClickOutside = () => setConfirmDeleteId(null);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [confirmDeleteId]);

  const getInitials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  };

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFriends = friends.filter(f =>
    (f.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={`sidebar${isMobileHidden ? ' hidden-mobile' : ''}`}>
        <div className="sidebar-header">
          <h2>💬 ChatRoom</h2>
          {tab === 'chats' && (
            <button
              className="btn-icon"
              onClick={() => setShowCreate(true)}
              title="New chatroom"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab${tab === 'chats' ? ' active' : ''}`}
            onClick={() => setTab('chats')}
          >
            💬 Chats
          </button>
          <button
            className={`sidebar-tab${tab === 'friends' ? ' active' : ''}`}
            onClick={() => setTab('friends')}
          >
            👥 Friends
          </button>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder={tab === 'chats' ? 'Search conversations…' : 'Search friends…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="sidebar-rooms">
          {tab === 'chats' && (
            <>
              {filteredRooms.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {search ? 'No results' : 'No chats yet. Create one!'}
                </div>
              )}
              {filteredRooms.map(room => {
                const unread = unreadMap[room.id] || 0;
                const isConfirming = confirmDeleteId === room.id;
                return (
                  <div key={room.id}>
                    <div
                      className={`room-item${activeRoom?.id === room.id ? ' active' : ''}`}
                      onClick={() => !isConfirming && onSelectRoom(room)}
                    >
                      <div className="room-avatar">{getInitials(room.name)}</div>
                      <div className="room-info">
                        <div className="room-name">{room.name}</div>
                        <div className="room-last-msg">
                          {room.lastMessage || 'No messages yet'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {formatTime(room.lastMessageAt)}
                        </span>
                        {unread > 0 && (
                          <span className="unread-badge badge-pulse">{unread > 99 ? '99+' : unread}</span>
                        )}
                        <button
                          className="btn-icon room-delete-btn"
                          title="Leave / delete chat"
                          onClick={e => { e.stopPropagation(); setConfirmDeleteId(room.id); }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isConfirming && (
                      <div className="delete-confirm-bar" onMouseDown={e => e.stopPropagation()}>
                        <span>Delete "{room.name}"?</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                            onClick={() => { onDeleteRoom(room.id); setConfirmDeleteId(null); }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {tab === 'friends' && (
            <>
              {filteredFriends.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {search ? 'No results' : 'No friends yet. Join a chatroom!'}
                </div>
              )}
              {filteredFriends.map(friend => {
                const isBlocked = (userProfile?.blockedUsers || []).includes(friend.uid);
                return (
                <div
                  key={friend.uid}
                  className="friend-item"
                  onDoubleClick={() => onOpenDM(friend.uid)}
                  title="Double-click to open chat"
                >
                  <div
                    className={`friend-avatar${isBlocked ? ' blocked-avatar' : ''}`}
                    onClick={e => { e.stopPropagation(); setPopupUID(friend.uid); }}
                    title="View profile"
                  >
                    {friend.photoURL
                      ? <img src={friend.photoURL} alt="" />
                      : (friend.username || '?')[0].toUpperCase()}
                    {isBlocked && <div className="blocked-slash" />}
                  </div>
                  <div className="room-info">
                    <div className="room-name">{friend.username || friend.email}</div>
                    <div className="room-last-msg">{friend.email}</div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => onOpenDM(friend.uid)}
                    title="Open chat"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </button>
                </div>
                );
              })}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-footer" onClick={() => setShowProfile(true)}>
            <div className="user-avatar">
              {userProfile?.photoURL
                ? <img src={userProfile.photoURL} alt="avatar" />
                : getInitials(userProfile?.username)}
            </div>
            <div className="user-info">
              <div className="username">{userProfile?.username || 'User'}</div>
              <div className="user-email">{userProfile?.email}</div>
            </div>
            <button
              className="btn-icon danger"
              onClick={(e) => { e.stopPropagation(); signOut(auth); }}
              title="Sign out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {popupUID && (
        <UserProfilePopup uid={popupUID} onClose={() => setPopupUID(null)} />
      )}
    </>
  );
}
