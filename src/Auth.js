import { useState } from 'react';
import Signup from './Signup';
import Login from './signup/login';

export default function Auth() {
  const [isSignup, setIsSignup] = useState(true);

  return (
    <div>
      {isSignup ? <Signup /> : <Login />}

      <div style={{ marginTop: '10px' }}>
        {isSignup ? (
          <p>
            Déjà un compte ?{' '}
            <button className="btn" onClick={() => setIsSignup(false)}>
              Se connecter
            </button>
          </p>
        ) : (
          <p>
            Pas encore de compte ?{' '}
            <button className="btn" onClick={() => setIsSignup(true)}>
              S'inscrire
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
