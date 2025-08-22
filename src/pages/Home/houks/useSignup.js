// src/hooks/useSignup.js
import { useState } from 'react';
import { auth } from '../firebase/src/firebase/config';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function useSignup() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const signup = async (email, password, displayName) => {
    setError(null);
    setIsPending(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      setIsPending(false);
      return cred.user;
    } catch (err) {
      console.error(err.message);
      setError(err.message);
      setIsPending(false);
      return null;
    }
  };

  return { signup, isPending, error };
}
