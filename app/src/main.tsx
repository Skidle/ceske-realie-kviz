import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from "@vercel/analytics/react";
import App from './App';
import './styles/tailwind.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root is missing from index.html');
}

const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
