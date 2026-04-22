import React, { useState } from 'react';
import { auth, db } from '../../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function AuthPage() {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearError = () => setError('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    clearError();
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = username.trim() || email.split('@')[0];
      await updateProfile(user, { displayName });
      const profileRef = doc(db, 'users', user.uid);
      const existing = await getDoc(profileRef);
      if (!existing.exists()) {
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          username: displayName,
          photoURL: null,
          phone: '',
          address: '',
          blockedUsers: [],
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    clearError();
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const profileRef = doc(db, 'users', user.uid);
      const existing = await getDoc(profileRef);
      if (!existing.exists()) {
        await setDoc(profileRef, {
          uid: user.uid,
          email: user.email,
          username: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || null,
          phone: '',
          address: '',
          blockedUsers: [],
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>💬</span>
          <h1>ChatRoom</h1>
          <p>Connect with friends in real time</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
            onClick={() => { setTab('signin'); clearError(); }}
          >Sign In</button>
          <button
            className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => { setTab('signup'); clearError(); }}
          >Sign Up</button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {tab === 'signin' ? (
          <form className="auth-form" onSubmit={handleSignIn} key="signin">
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoFocus />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div className="auth-divider">or</div>
            <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon /> Continue with Google
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUp} key="signup">
            <div className="auth-field">
              <label>Username (optional)</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Your display name" />
            </div>
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" required />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat password" required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <div className="auth-divider">or</div>
            <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon /> Continue with Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function mapAuthError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/invalid-credential': 'Invalid email or password.',
  };
  return map[code] || 'Authentication failed. Please try again.';
}
