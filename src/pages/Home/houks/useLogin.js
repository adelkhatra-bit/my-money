// src/hooks/useLogin.js
import { useState } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function useLogin() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setError(null);
    setIsPending(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setIsPending(false);
      return cred.user;
    } catch (err) {
      console.error(err.message);
      setError(err.message);
      setIsPending(false);
      return null;
    }
  };

  return { login, isPending, error };
}
