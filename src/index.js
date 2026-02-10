import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

console.log('✅ [DIAGNOSTIC] index.js loaded at', new Date().toISOString());
console.log('✅ [DIAGNOSTIC] React version:', React.version);
console.log('✅ [DIAGNOSTIC] App component:', typeof App);

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

console.log('✅ [DIAGNOSTIC] Checking root element...');
const rootElement = document.getElementById('root');
console.log('✅ [DIAGNOSTIC] Root element found:', !!rootElement);

if (!rootElement) {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: #ef4444;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      font-size: 24px;
      text-align: center;
      padding: 40px;
    ">
      ❌ ERREUR CRITIQUE<br/>
      <small style="font-size: 16px; margin-top: 20px;">Élément #root introuvable dans le DOM</small>
    </div>
  `;
  throw new Error('Root element not found');
}

console.log('✅ [DIAGNOSTIC] Creating React root...');
const root = createRoot(rootElement);
console.log('✅ [DIAGNOSTIC] React root created successfully');

console.log('✅ [DIAGNOSTIC] Rendering App component...');
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log('✅ [DIAGNOSTIC] App component rendered - check browser!');
