import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Função para configurar estilos (Tailwind e Fontes) automaticamente
const setupDependencies = () => {
  const tailwindScript = document.createElement('script');
  tailwindScript.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(tailwindScript);

  const fontLink = document.createElement('link');
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.innerHTML = `
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
  `;
  document.head.appendChild(style);
};

setupDependencies();

// Lógica para encontrar ou criar o elemento "root"
const container = document.getElementById('root');
const rootElement = container || (() => {
  const el = document.createElement('div');
  el.id = 'root';
  document.body.appendChild(el);
  return el;
})();

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);