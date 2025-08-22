import React from 'react';
import { render, screen } from '@testing-library/react';
import Factures from './Factures';

test('affiche les en-têtes du tableau', () => {
  render(<Factures />);
  expect(screen.getByText('Facture')).toBeInTheDocument();
  expect(screen.getByText('Client')).toBeInTheDocument();
  expect(screen.getByText('Montant (€)')).toBeInTheDocument();
  expect(screen.getByText('Statut')).toBeInTheDocument();
});
