import { useState } from 'react';
import { getAuth, signInWithCustomToken, signOut } from '@react-native-firebase/auth';
import { Role } from '../types';
import { setAuthToken, errorMessage } from '../api/client';
import * as authApi from '../api/authApi';

// Who's logged in, and logging in / out.
export function useAuth() {
  // The login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // red message on the login screen
  const [loginNotice, setLoginNotice] = useState(''); // green message on the login screen

  // The logged-in user ('' token = nobody logged in)
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<Role>('EXTRA');
  const [coordinatorProduction, setCoordinatorProduction] = useState<string | null>(null);

  // Returns true if it worked, so App can go to Home
  const login = async (): Promise<boolean> => {
    setLoginNotice('');
    try {
      const data = await authApi.login(email, password);

      await signInWithCustomToken(getAuth(), data.firebaseToken);

      setAuthToken(data.token); // every API call from now on sends this token
      setToken(data.token);
      setUserId(data.user.id);
      setUserName(data.user.name);
      setRole(data.user.role);
      setCoordinatorProduction(data.user.production?.name ?? null);
      return true;
    } catch (error) {
      setMessage(`Login failed: ${errorMessage(error)}`);
      return false;
    }
  };

  const logout = async () => {
    await signOut(getAuth());
    setToken('');
    setAuthToken(''); // forget the token, so nothing is sent with this login any more
    setUserId('');
    setUserName('');
    setEmail('');
    setPassword('');
    setMessage('');
    setCoordinatorProduction(null);
  };

  // After Change Password: this phone stays logged in with the new token
  const updateToken = (newToken: string) => {
    setAuthToken(newToken); // the API calls use the fresh token too
    setToken(newToken);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    message,
    setMessage,
    loginNotice,
    setLoginNotice,
    token,
    userId,
    userName,
    role,
    coordinatorProduction,
    login,
    logout,
    updateToken,
  };
}