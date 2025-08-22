import React from 'react';
import styles from './Factures.module.css';

export default function Factures() {
  const rows = [
    { id: 'F-001', client: 'Alpha', montant: 1200, statut: 'payée' },
    { id: 'F-002', client: 'Beta', montant: 520, statut: 'en attente' },
  ];

  return (
    <div className={styles.page}>
      <h1>Factures</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Facture
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Client
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Montant (€)
            </th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: 8 }}>{r.id}</td>
              <td style={{ padding: 8 }}>{r.client}</td>
              <td style={{ padding: 8 }}>{r.montant}</td>
              <td style={{ padding: 8 }}>{r.statut}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
