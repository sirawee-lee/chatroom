import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Tear down previous profile listener if any
      profileUnsubRef.current?.();
      profileUnsubRef.current = null;

      if (user) {
        const profileRef = doc(db, 'users', user.uid);
        const snap = await getDoc(profileRef);

        if (!snap.exists()) {
          const newProfile = {
            uid: user.uid,
            email: user.email,
            username: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            phone: '',
            address: '',
            blockedUsers: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfile);
        }

        // Real-time listener — userProfile stays in sync automatically
        profileUnsubRef.current = onSnapshot(profileRef, (s) => {
          if (s.exists()) setUserProfile(s.data());
        });
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => {
      unsubAuth();
      profileUnsubRef.current?.();
    };
  }, []);

  // Still exported for compatibility, but rarely needed now
  const refreshProfile = async () => {
    if (!currentUser) return;
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    if (snap.exists()) setUserProfile(snap.data());
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, setUserProfile, refreshProfile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
