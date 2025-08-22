import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('render navbar links', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(screen.getByText(/Accueil/i)).toBeInTheDocument();
  expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
  expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
});
