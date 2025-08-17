import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
const taskPulseLogo = new URL('./assets/taskpulse-logo.svg', import.meta.url).href;

const setFavicon = (url: string) => {
  const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (link) {
    link.href = url;
  } else {
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.href = url;
    document.head.appendChild(newLink);
  }
};

setFavicon(taskPulseLogo);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);