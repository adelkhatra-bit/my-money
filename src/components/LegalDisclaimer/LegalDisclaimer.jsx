import React from 'react';
import styles from './LegalDisclaimer.module.css';

const LegalDisclaimer = ({ onAccept }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h1 className={styles.title}>Avertissement Important</h1>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Avertissement sur les Risques</h2>
            <p>
              Le trading de produits financiers comporte un niveau de risque élevé et peut ne pas
              convenir à tous les investisseurs. Vous pouvez perdre tout ou partie de votre capital
              investi.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Nature de l'Outil</h2>
            <p>
              Cette plateforme est un <strong>outil d'aide à la décision</strong> uniquement.
              Elle ne fournit pas de conseils financiers personnalisés et ne constitue pas une
              recommandation d'investissement.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Pas de Promesse de Gains</h2>
            <p>
              Les performances passées ne garantissent pas les résultats futurs. Aucune garantie
              n'est donnée quant à la rentabilité de l'utilisation de cette plateforme.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Responsabilité de l'Utilisateur</h2>
            <p>
              Vous êtes seul responsable de vos décisions de trading. Il est recommandé de :
            </p>
            <ul>
              <li>Ne trader qu'avec des fonds que vous pouvez vous permettre de perdre</li>
              <li>Comprendre pleinement les risques avant de trader</li>
              <li>Consulter un conseiller financier indépendant si nécessaire</li>
              <li>Respecter les règles de gestion du risque</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Mode de Fonctionnement</h2>
            <p>
              La plateforme génère des signaux basés sur l'analyse technique. Ces signaux sont
              fournis à titre informatif uniquement. L'utilisateur doit :
            </p>
            <ul>
              <li>Vérifier chaque signal avant toute action</li>
              <li>Adapter la taille des positions à sa situation personnelle</li>
              <li>Ne jamais exécuter un signal aveuglément</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Conformité Européenne</h2>
            <p>
              En utilisant cette plateforme, vous reconnaissez avoir lu, compris et accepté
              l'intégralité de cet avertissement. Vous confirmez que vous utilisez cet outil
              en toute connaissance de cause.
            </p>
          </section>

          <section className={styles.warning}>
            <h2>⚠️ Attention</h2>
            <p>
              Le trading peut entraîner des pertes importantes. N'investissez que ce que vous
              pouvez vous permettre de perdre.
            </p>
          </section>
        </div>

        <div className={styles.actions}>
          <button onClick={onAccept} className={styles.acceptBtn}>
            J'ai lu et j'accepte les conditions
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;
