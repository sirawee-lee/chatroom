import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateRoomModal({ onClose }) {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const searchUser = async () => {
    if (!inviteEmail.trim()) return;
    setSearching(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', inviteEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      const found = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSearchResults(found.filter(u => u.uid !== currentUser.uid && !members.some(m => m.uid === u.uid)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addMember = (user) => {
    setMembers(prev => [...prev, user]);
    setSearchResults([]);
    setInviteEmail('');
  };

  const removeMember = (uid) => {
    setMembers(prev => prev.filter(m => m.uid !== uid));
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a room name.'); return; }
    setCreating(true);
    setError('');
    try {
      const memberUids = [currentUser.uid, ...members.map(m => m.uid)];
      await addDoc(collection(db, 'chatrooms'), {
        name: name.trim(),
        members: memberUids,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
      });
      onClose();
    } catch {
      setError('Failed to create chatroom. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>➕ New Chatroom</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body create-room-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="form-field">
            <label>Room Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Study Group, Family Chat…"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Invite Members (by email)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchUser()}
                placeholder="member@example.com"
                style={{ flex: 1 }}
              />
              <button className="btn-add" onClick={searchUser} disabled={searching || !inviteEmail.trim()}>
                {searching ? '…' : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="user-search-results">
              {searchResults.map(u => (
                <div key={u.uid} className="user-result">
                  <div>
                    <div className="user-info">{u.username || u.email}</div>
                    <div className="user-email-sm">{u.email}</div>
                  </div>
                  <button className="btn-add" onClick={() => addMember(u)}>Add</button>
                </div>
              ))}
            </div>
          )}

          {members.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Members to add ({members.length}):
              </div>
              {members.map(m => (
                <div key={m.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', marginBottom: 4, fontSize: '0.875rem' }}>
                  <span>{m.username || m.email}</span>
                  <button style={{ color: 'var(--danger)', fontSize: '0.9rem' }} onClick={() => removeMember(m.uid)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
