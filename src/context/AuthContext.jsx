import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'cook' | 'admin' | null
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // فحص إذا كان طباخة
        const cookDoc = await getDoc(doc(db, 'cooks', firebaseUser.uid));
        if (cookDoc.exists()) {
          setUserRole('cook');
          setUserData({ id: cookDoc.id, ...cookDoc.data() });
          setLoading(false);
          return;
        }
        
        // فحص إذا كان admin
        const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
        if (adminDoc.exists()) {
          setUserRole('admin');
          setUserData({ id: adminDoc.id, ...adminDoc.data() });
          setLoading(false);
          return;
        }
        
        setUserRole(null);
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);