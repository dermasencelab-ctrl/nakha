import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Ensure sessions survive browser restarts — set once at module load
setPersistence(auth, browserLocalPersistence).catch(() => {});

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
    // التحقق من عدم تكرار رقم الهاتف
    const { getDocs, query, where, collection } = await import('firebase/firestore');
    const phoneQuery = query(
      collection(db, 'cooks'),
      where('phone', '==', cookData.phone)
    );
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) {
      const error = new Error('رقم الهاتف مسجّل مسبقاً');
      error.code = 'auth/phone-already-in-use';
      throw error;
    }

    // التحقق من عدم تكرار الاسم
    const nameQuery = query(
      collection(db, 'cooks'),
      where('name', '==', cookData.name.trim())
    );
    const nameSnap = await getDocs(nameQuery);
    if (!nameSnap.empty) {
      const error = new Error('هذا الاسم مسجّل مسبقاً');
      error.code = 'auth/name-already-in-use';
      throw error;
    }

    // إنشاء حساب في Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // إنشاء وثيقة في cooks
    const cookRef = doc(db, 'cooks', user.uid);
    await setDoc(cookRef, {
      userId: user.uid,
      name: cookData.name,
      bio: cookData.bio || '',
      phone: cookData.phone,
      neighborhood: cookData.neighborhood,
      photo: cookData.photo || '',
      cookType: cookData.cookType || 'home_cook',
      specialties: cookData.specialties || [],
      cookDescription: cookData.cookDescription || '',
      socialLink: cookData.socialLink || '',
      portfolioImages: cookData.portfolioImages || [],
      status: 'pending',
      rating: 0,
      balance: 0,
      totalCommission: 0,
      totalOrders: 0,
      totalRatings: 0,
      averageRating: 0,
      ratingSum: 0,
      isFoundingMember: false,
      foundingMemberNumber: null,
      freeOrdersRemaining: 0,
      freeOrdersUsed: 0,
      createdAt: serverTimestamp(),
    });

    // إنشاء وثيقة في users
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