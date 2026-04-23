import React, { useState } from 'react';
import { auth, db, storage } from '../../firebase/config';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileModal({ onClose }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(userProfile?.username || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState(userProfile?.address || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || null);
  const [previewURL, setPreviewURL] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blockedUsers, setBlockedUsers] = useState(userProfile?.blockedUsers || []);
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const [tab, setTab] = useState('profile');
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    const loadBlockedProfiles = async () => {
      if (!blockedUsers.length) return;
      const profiles = await Promise.all(
        blockedUsers.map(async uid => {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? { uid, ...snap.data() } : { uid, username: uid };
        })
      );
      setBlockedProfiles(profiles);
    };
    loadBlockedProfiles();
  }, [blockedUsers]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!username.trim()) { setError('Username cannot be empty.'); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let newPhotoURL = photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
        await uploadBytes(storageRef, photoFile);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(currentUser, { displayName: username.trim(), photoURL: newPhotoURL });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: username.trim(),
        phone: phone.trim(),
        address: address.trim(),
        photoURL: newPhotoURL,
      });

      await refreshProfile();
      setPhotoURL(newPhotoURL);
      setPreviewURL(null);
      setPhotoFile(null);
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (uid) => {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      blockedUsers: arrayRemove(uid),
    });
    setBlockedUsers(prev => prev.filter(u => u !== uid));
    setBlockedProfiles(prev => prev.filter(u => u.uid !== uid));
    await refreshProfile();
  };

  const displayPhoto = previewURL || photoURL;
  const initials = (username || currentUser?.email || '?')[0].toUpperCase();

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>⚙️ Profile Settings</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {['profile', 'blocked'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.65rem', fontSize: '0.85rem', fontWeight: 500,
                color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'var(--transition)',
              }}
            >
              {t === 'profile' ? '👤 Profile' : `🚫 Blocked (${blockedUsers.length})`}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <>
            <div className="modal-body">
              {error && <div className="auth-error">{error}</div>}
              {success && <div style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.875rem', fontSize: '0.85rem' }}>{success}</div>}

              <div className="avatar-upload">
                <div className="avatar-preview" onClick={handleAvatarClick}>
                  {displayPhoto ? <img src={displayPhoto} alt="avatar" /> : initials}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to change photo</span>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              <div className="form-field">
                <label>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Display name" />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={userProfile?.email || ''} disabled />
              </div>
              <div className="form-field">
                <label>Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-field">
                <label>Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Your address" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}

        {tab === 'blocked' && (
          <div className="modal-body">
            {blockedProfiles.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem' }}>
                No blocked users
              </div>
            ) : (
              <div className="blocked-list">
                {blockedProfiles.map(u => (
                  <div key={u.uid} className="blocked-item">
                    <div className="blocked-name">{u.username || u.email || u.uid}</div>
                    <button className="btn-danger" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => handleUnblock(u.uid)}>
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
