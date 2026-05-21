import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// PWA: Service Worker Registration for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // sw.js lives in /public and is served at the root
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('PWA: Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('PWA: Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);