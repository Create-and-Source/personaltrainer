import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, getSession, signOut as cognitoSignOut } from './auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      getSession()
        .then(session => {
          if (session?.isValid()) {
            setUser({
              email: currentUser.getUsername(),
              token: session.getIdToken().getJwtToken(),
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    cognitoSignOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
