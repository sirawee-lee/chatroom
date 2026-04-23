import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function InviteMemberModal({ room, currentMembers, onClose }) {
  const { currentUser, userProfile } = useAuth();
  const [searchEmail, setSearchEmail] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim().toLowerCase()));
      const snap = await getDocs(q);
      const found = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = found.filter(u => !currentMembers.some(m => m.uid === u.uid));
      setResults(filtered);
      if (filtered.length === 0) setError('User not found or already a member.');
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (user) => {
    setAdding(user.uid);
    setError('');
    try {
      await updateDoc(doc(db, 'chatrooms', room.id), {
        members: arrayUnion(user.uid),
      });
      setSuccess(`${user.username || user.email} added to the room!`);
      setResults(prev => prev.filter(u => u.uid !== user.uid));
    } catch {
      setError('Failed to add member.');
    } finally {
      setAdding(null);
    }
  };

  const handleBlockToggle = async (user) => {
    const isBlocked = (userProfile?.blockedUsers || []).includes(user.uid);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      blockedUsers: isBlocked ? [] : arrayUnion(user.uid),
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>👥 Invite Members</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.875rem', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          <div className="form-field">
            <label>Search by email</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="user@example.com"
                style={{ flex: 1 }}
                autoFocus
              />
              <button className="btn-add" onClick={handleSearch} disabled={searching}>
                {searching ? '…' : 'Search'}
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="user-search-results">
              {results.map(u => (
                <div key={u.uid} className="user-result">
                  <div>
                    <div className="user-info">{u.username || 'Unknown'}</div>
                    <div className="user-email-sm">{u.email}</div>
                  </div>
                  <button
                    className="btn-add"
                    onClick={() => handleAdd(u)}
                    disabled={adding === u.uid}
                  >
                    {adding === u.uid ? '…' : '+ Add'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
              Current Members ({currentMembers.length})
            </div>
            {currentMembers.map(m => {
              const isBlocked = (userProfile?.blockedUsers || []).includes(m.uid);
              const isSelf = m.uid === currentUser.uid;
              return (
                <div key={m.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{m.username || m.email} {isSelf ? '(you)' : ''}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                  </div>
                  {!isSelf && (
                    <button
                      style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isBlocked ? 'var(--success)' : 'var(--danger)'}`,
                        color: isBlocked ? 'var(--success)' : 'var(--danger)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'transparent',
                        transition: 'var(--transition)',
                      }}
                      onClick={() => handleBlockToggle(m)}
                    >
                      {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
