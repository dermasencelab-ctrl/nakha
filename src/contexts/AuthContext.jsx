import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { FOUNDING_MEMBERS } from '../config/settings';

// converts phone number to a valid email for Firebase Auth
const phoneToEmail = (phone) => `${phone}@nakha.customer`;

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
        const profileData = userDoc.data();
        // For cooks, attach current approval status from cooks collection
        if (profileData.role === 'cook') {
          const cookDoc = await getDoc(doc(db, 'cooks', user.uid));
          profileData.cookStatus = cookDoc.exists()
            ? (cookDoc.data().status || 'pending')
            : 'pending';
        }
        return profileData;
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
  const signupCook = async (email, password, cookData, inviteData = null) => {
    // التحقق من عدم تكرار رقم الهاتف
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

    // Validate invite token against Firestore (not just sessionStorage)
    let isInvited = false;
    let inviteCodeDocId = null;
    let inviteTokenDocId = null;
    if (inviteData?.token) {
      const tokenQuery = query(
        collection(db, 'invite_tokens'),
        where('token', '==', inviteData.token),
        where('used', '==', false)
      );
      const tokenSnap = await getDocs(tokenQuery);
      if (!tokenSnap.empty) {
        const tokenDoc = tokenSnap.docs[0];
        const tokenInfo = tokenDoc.data();
        const expiresAt = tokenInfo.expires_at?.toDate ? tokenInfo.expires_at.toDate() : null;
        if (expiresAt && expiresAt > new Date()) {
          inviteTokenDocId = tokenDoc.id;
          inviteCodeDocId = tokenInfo.invite_code_id;

          // Double-check the invite code is still valid
          if (inviteCodeDocId) {
            const codeDoc = await getDoc(doc(db, 'invite_codes', inviteCodeDocId));
            if (codeDoc.exists()) {
              const codeData = codeDoc.data();
              if (!codeData.used && codeData.active !== false) {
                const codeExpiry = codeData.expires_at?.toDate ? codeData.expires_at.toDate() : null;
                if (!codeExpiry || codeExpiry > new Date()) {
                  isInvited = true;
                }
              }
            }
          }
        }
      }
    }

    // Determine founding member status
    let foundingMemberNumber = null;
    if (isInvited && FOUNDING_MEMBERS.enabled) {
      const cooksSnap = await getDocs(
        query(collection(db, 'cooks'), where('isFoundingMember', '==', true))
      );
      if (cooksSnap.size < FOUNDING_MEMBERS.maxCount) {
        foundingMemberNumber = cooksSnap.size + 1;
      }
    }

    const grantFounder = isInvited && foundingMemberNumber !== null;

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
      balance: grantFounder ? FOUNDING_MEMBERS.welcomeBalance : 0,
      totalCommission: 0,
      totalOrders: 0,
      totalRatings: 0,
      averageRating: 0,
      ratingSum: 0,
      isFoundingMember: grantFounder,
      foundingMemberNumber: foundingMemberNumber,
      freeOrdersRemaining: grantFounder ? FOUNDING_MEMBERS.freeOrders : 0,
      freeOrdersUsed: 0,
      inviteCode: inviteData?.code || null,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    });

    // Mark invite code as used
    if (isInvited && inviteCodeDocId) {
      await updateDoc(doc(db, 'invite_codes', inviteCodeDocId), {
        used: true,
        used_by: user.uid,
        used_by_name: cookData.name,
        used_by_email: email,
        used_at: serverTimestamp(),
      });
    }

    // Mark invite token as consumed
    if (inviteTokenDocId) {
      await updateDoc(doc(db, 'invite_tokens', inviteTokenDocId), {
        used: true,
        used_by: user.uid,
        used_at: serverTimestamp(),
      });
    }

    // Log analytics event
    try {
      await addDoc(collection(db, 'invite_analytics'), {
        event: 'account_created',
        code: inviteData?.code || null,
        userId: user.uid,
        isFoundingMember: grantFounder,
        foundingMemberNumber,
        timestamp: serverTimestamp(),
      });
    } catch {}

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

  // تسجيل زبون جديد (بالهاتف وكلمة المرور)
  const signupCustomer = async (phone, password) => {
    // التحقق من عدم تكرار رقم الهاتف في Firestore
    const phoneQuery = query(collection(db, 'customers'), where('phone', '==', phone));
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) {
      const error = new Error('رقم الهاتف مسجّل مسبقاً');
      error.code = 'auth/phone-already-in-use';
      throw error;
    }

    const email = phoneToEmail(phone);
    let result;
    try {
      result = await createUserWithEmailAndPassword(auth, email, password);
    } catch (firebaseErr) {
      // Firebase throws email-already-in-use when the derived email is taken;
      // map it to phone-already-in-use so the UI shows the correct message.
      if (firebaseErr.code === 'auth/email-already-in-use') {
        const err = new Error('رقم الهاتف مسجّل مسبقاً');
        err.code = 'auth/phone-already-in-use';
        throw err;
      }
      throw firebaseErr;
    }
    const user = result.user;

    const customerData = {
      uid: user.uid,
      phone,
      role: 'customer',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };
    await setDoc(doc(db, 'customers', user.uid), customerData);
    await setDoc(doc(db, 'users', user.uid), { ...customerData });

    setUserProfile({ ...customerData });
    return { user, profile: customerData };
  };

  // تسجيل دخول الزبون (بالهاتف وكلمة المرور)
  const loginCustomer = async (phone, password) => {
    const email = phoneToEmail(phone);
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(result.user);
    if (profile) {
      await setDoc(doc(db, 'users', result.user.uid), { lastLogin: serverTimestamp() }, { merge: true });
    }
    setUserProfile(profile);
    return { user: result.user, profile };
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
    signupCustomer,
    loginCustomer,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};