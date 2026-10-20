import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './ui/hud.css';
import './ui/hud2.css';
import './ui/mobile.css';
import { useGame } from './store';
import { applyLang } from './i18n';
(window as unknown as { __setLook: unknown }).__setLook = (p: object) => useGame.getState().setLook(p);
applyLang(useGame.getState().settings.lang);
createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost') && !import.meta.env.DEV) navigator.serviceWorker.register('/sw.js').catch(() => {});
