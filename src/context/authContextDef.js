import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export default AuthContext;
