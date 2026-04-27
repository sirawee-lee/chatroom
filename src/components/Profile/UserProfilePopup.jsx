import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function UserProfilePopup({ uid, onClose }) {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(null);

  const isBlocked = userProfile?.blockedUsers?.includes(uid);

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    });
  }, [uid]);

  const toggleBlock = async () => {
    const userRef = doc(db, 'users', currentUser.uid);
    if (isBlocked) {
      await updateDoc(userRef, { blockedUsers: arrayRemove(uid) });
    } else {
      await updateDoc(userRef, { blockedUsers: arrayUnion(uid) });
    }
    await refreshProfile();
  };

  const initials = profile ? (profile.username || '?')[0].toUpperCase() : '?';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="user-profile-popup">
        <div className="popup-topbar">
          <button
            className={`btn-block-user${isBlocked ? ' is-blocked' : ''}`}
            onClick={toggleBlock}
            disabled={!profile}
          >
            {isBlocked ? '✓ Unblock' : '🚫 Block'}
          </button>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        {!profile ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div className="popup-body">
            <div className={`popup-avatar-circle${isBlocked ? ' blocked-avatar' : ''}`}>
              {profile.photoURL
                ? <img src={profile.photoURL} alt="" />
                : initials}
              {isBlocked && <div className="blocked-slash" />}
            </div>
            <div className={`popup-username${isBlocked ? ' blocked-name' : ''}`}>
              {profile.username}
            </div>
            {isBlocked && (
              <div className="blocked-badge">🚫 Blocked</div>
            )}
            <div className="popup-email">{profile.email}</div>
            {profile.phone && (
              <div className="popup-detail-row">
                <span>📞</span>
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.address && (
              <div className="popup-detail-row">
                <span>📍</span>
                <span>{profile.address}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
