import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    // TODO: brancher Firebase plus tard
    setTimeout(() => {
      setIsPending(false);
      setError("Démo: authentification non branchée.");
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
      <h2>Se connecter</h2>

      <label>
        <span>Email :</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label>
        <span>Mot de passe :</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      {!isPending && <button className="btn">Connexion</button>}
      {isPending && (
        <button className="btn" disabled>
          Chargement…
        </button>
      )}

      {error && <p className="error">{error}</p>}
    </form>
  );
}