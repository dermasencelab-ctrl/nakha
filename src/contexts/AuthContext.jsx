import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, cookId, ... }
  const [loading, setLoading] = useState(true);

  // جلب بيانات المستخدم من Firestore
  const fetchUserProfile = async (user) => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // تسجيل الدخول
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(result.user);
    setUserProfile(profile);
    return { user: result.user, profile };
  };

  // تسجيل طباخة جديدة
  const signupCook = async (email, password, cookData) => {
    // 1. إنشاء حساب في Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // 2. إنشاء وثيقة في cooks (status: pending)
    const cookRef = doc(db, 'cooks', user.uid); // نستخدم uid كـ cookId للبساطة
    await setDoc(cookRef, {
      userId: user.uid,
      name: cookData.name,
      bio: cookData.bio || '',
      phone: cookData.phone,
      neighborhood: cookData.neighborhood,
      photo: cookData.photo || '',
      status: 'pending',
      rating: 0,
      createdAt: serverTimestamp(),
    });

    // 3. إنشاء وثيقة في users
    const userProfileData = {
      uid: user.uid,
      email: user.email,
      role: 'cook',
      cookId: user.uid,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), userProfileData);

    setUserProfile(userProfileData);
    return { user, profile: userProfileData };
  };

  // تسجيل الخروج
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // مراقبة حالة المصادقة
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    userRole: userProfile?.role || null,
    loading,
    login,
    signupCook,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
