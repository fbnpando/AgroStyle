import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(fullName, email, password, role) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Buyers are auto-approved; producers and transporters require admin review
    const status = role === 'buyer' ? 'approved' : 'pending';

    await setDoc(doc(db, 'users', user.uid), {
      fullName,
      email: user.email,
      role,
      status,
      createdAt: new Date().toISOString()
    });

    if (role === 'producer') {
      await setDoc(doc(db, 'farms', user.uid), {
        ownerId: user.uid,
        name: 'Mi Finca',
        createdAt: new Date().toISOString()
      });
    }

    setUserRole(role);
    setUserStatus(status);
    return userCredential;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserStatus(data.status || 'approved');
          setUserData(data);
        }
      } else {
        setUserRole(null);
        setUserStatus(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userStatus,
    userData,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
