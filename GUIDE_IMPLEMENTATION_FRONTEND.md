# Guide d'Implémentation Frontend

## Intégration des Fonctionnalités Backend

### 1. Bouton "Demander Mon Cadeau" 🎁

**Emplacement**: Page Profil ou Dashboard

**Code React Example**:
```jsx
import { supabase } from './lib/supabaseClient';

const RequestFreeTrialButton = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const requestFreeTrial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_free_trial');

      if (error) throw error;

      if (data.success) {
        setMessage('✅ ' + data.message);
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={requestFreeTrial}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Envoi...' : 'Demander Mon Cadeau (5 positions gratuites)'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
```

### 2. Affichage des Crédits 💰

**Code React Example**:
```jsx
const UserCredits = () => {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_credits');

      if (error) throw error;

      if (data.success) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Erreur chargement crédits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="credits-display">
      <h3>Mes Crédits</h3>
      {credits.map(credit => (
        <div key={credit.market} className="credit-card">
          <h4>{credit.market}</h4>
          <p>Crédits bonus: {credit.bonus_credits}</p>
          <p>Crédits achetés: {credit.purchased_credits}</p>
          <p>Utilisés: {credit.used_credits}</p>
          <p className="remaining">Restants: {credit.remaining_credits}</p>
          {credit.expires_at && (
            <p>Expire le: {new Date(credit.expires_at).toLocaleDateString()}</p>
          )}
        </div>
      ))}
    </div>
  );
};
```

### 3. Panel Super Admin 👑

**Page dédiée pour les super admins**:

```jsx
const SuperAdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadRequests();
  }, []);

  const checkAdminStatus = async () => {
    const { data } = await supabase.rpc('is_super_admin');
    setIsAdmin(data);
  };

  const loadRequests = async () => {
    // Charger toutes les demandes en attente
    const { data } = await supabase
      .from('free_trial_requests')
      .select(`
        *,
        user_profiles!inner(email)
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    setRequests(data || []);
  };

  const approveTrial = async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('approve_free_trial', {
        request_id: requestId,
        credits_to_grant: 5
      });

      if (error) throw error;

      if (data.success) {
        alert('✅ Test gratuit approuvé');
        loadRequests(); // Recharger la liste
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  const rejectTrial = async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('reject_free_trial', {
        request_id: requestId
      });

      if (error) throw error;

      if (data.success) {
        alert('✅ Demande refusée');
        loadRequests();
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  if (!isAdmin) {
    return <div>Accès refusé. Super Admin uniquement.</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Demandes de Test Gratuit</h2>

      {requests.length === 0 ? (
        <p>Aucune demande en attente</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Date de demande</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={request.id}>
                <td>{request.user_profiles.email}</td>
                <td>{new Date(request.created_at).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => approveTrial(request.id)}
                    className="btn-success"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => rejectTrial(request.id)}
                    className="btn-danger"
                  >
                    Refuser
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

### 4. Attribution Manuelle de Crédits (Super Admin)

```jsx
const GrantCreditsForm = () => {
  const [email, setEmail] = useState('');
  const [credits, setCredits] = useState(10);
  const [market, setMarket] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const grantCredits = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('grant_credits', {
        target_user_email: email,
        credits_amount: credits,
        market_name: market,
        credit_type: 'bonus'
      });

      if (error) throw error;

      if (data.success) {
        alert('✅ ' + data.message);
        setEmail('');
        setCredits(10);
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={grantCredits} className="grant-credits-form">
      <h3>Attribuer des Crédits</h3>

      <input
        type="email"
        placeholder="Email de l'utilisateur"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="number"
        min="1"
        placeholder="Nombre de crédits"
        value={credits}
        onChange={(e) => setCredits(parseInt(e.target.value))}
        required
      />

      <select value={market} onChange={(e) => setMarket(e.target.value)}>
        <option value="ALL">Tous les marchés</option>
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
        <option value="NASDAQ">NASDAQ</option>
        <option value="GOLD">GOLD</option>
      </select>

      <button type="submit" disabled={loading}>
        {loading ? 'Attribution...' : 'Attribuer'}
      </button>
    </form>
  );
};
```

## Protection des Routes Super Admin

```jsx
// Hook personnalisé pour vérifier si l'utilisateur est super admin
const useSuperAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data } = await supabase.rpc('is_super_admin');
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Erreur vérification admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdmin, loading };
};

// Composant de protection de route
const SuperAdminRoute = ({ children }) => {
  const { isAdmin, loading } = useSuperAdmin();

  if (loading) {
    return <div>Vérification des permissions...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Utilisation dans les routes
<Route
  path="/admin"
  element={
    <SuperAdminRoute>
      <SuperAdminPanel />
    </SuperAdminRoute>
  }
/>
```

## Notifications en Temps Réel (Optionnel)

Pour recevoir les notifications en temps réel des nouvelles demandes:

```jsx
useEffect(() => {
  // S'abonner aux changements sur free_trial_requests
  const subscription = supabase
    .channel('trial-requests')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'free_trial_requests'
      },
      (payload) => {
        // Nouvelle demande reçue
        console.log('Nouvelle demande:', payload);
        // Afficher une notification
        showNotification('Nouvelle demande de test gratuit');
        // Recharger la liste
        loadRequests();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Gestion des Erreurs Communes

```jsx
const handleSupabaseError = (error) => {
  if (error.message.includes('infinite recursion')) {
    return 'Erreur de configuration. Contactez le support.';
  }

  if (error.message.includes('Profile not found')) {
    return 'Profil introuvable. Veuillez vous reconnecter.';
  }

  if (error.message.includes('Unauthorized')) {
    return 'Accès refusé. Permissions insuffisantes.';
  }

  return error.message;
};
```

## Checklist d'Implémentation

- [ ] Intégrer le bouton "Demander Mon Cadeau"
- [ ] Afficher les crédits utilisateur
- [ ] Créer la page Super Admin
- [ ] Implémenter l'approbation/rejet des demandes
- [ ] Ajouter l'attribution manuelle de crédits
- [ ] Protéger les routes admin
- [ ] Tester tous les flux utilisateur
- [ ] Ajouter les notifications (optionnel)
- [ ] Gérer les erreurs gracieusement
- [ ] Documenter pour l'équipe

## Notes Importantes

1. **Toujours vérifier les erreurs**: Ne jamais supposer qu'un appel RPC réussit
2. **Recharger les données**: Après chaque action, recharger les données affectées
3. **Feedback utilisateur**: Toujours informer l'utilisateur du résultat d'une action
4. **Permissions**: Vérifier les permissions côté frontend ET backend
5. **Tests**: Tester avec des utilisateurs normaux ET super admins
