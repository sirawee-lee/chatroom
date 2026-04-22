import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const profileRef = doc(db, 'users', user.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          setUserProfile(snap.data());
        } else {
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
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
