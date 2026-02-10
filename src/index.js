import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

window.onerror = function(message, source, lineno, colno, error) {
  console.error('❌ [window.onerror]', { message, source, lineno, colno, error });

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ef4444;
    color: white;
    padding: 16px;
    z-index: 9999999;
    font-family: monospace;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;
  errorDiv.innerHTML = `
    <strong>⚠️ Error:</strong> ${message}<br/>
    <small>${source}:${lineno}:${colno}</small>
    <button onclick="this.parentElement.remove()" style="
      float: right;
      background: white;
      color: #ef4444;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">✕</button>
  `;
  document.body.appendChild(errorDiv);

  return false;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error('❌ [unhandledrejection]', event.reason);

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    background: #f97316;
    color: white;
    padding: 16px;
    z-index: 9999999;
    font-family: monospace;
    font-size: 14px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;
  errorDiv.innerHTML = `
    <strong>⚠️ Unhandled Promise Rejection:</strong> ${event.reason}<br/>
    <button onclick="this.parentElement.remove()" style="
      float: right;
      background: white;
      color: #f97316;
      border: none;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">✕</button>
  `;
  document.body.appendChild(errorDiv);
});

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
