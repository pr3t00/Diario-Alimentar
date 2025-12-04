import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' 

// O código abaixo procura a div "root" no HTML e injeta o App dentro dela
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
