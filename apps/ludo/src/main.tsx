import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { appPath } from './utils/basePath';

// Any profile photo that fails (an expired Telegram photo, a refused proxy, an old external
// placeholder saved in a browser) is swapped for the mascot instead of a broken-image icon.
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    const fallback = appPath('/assets/mikasa-mascot-thumb.jpg');
    if (target.src.endsWith(fallback)) return;
    target.src = fallback;
  },
  true,
);

createRoot(document.getElementById('root')!).render(<App />);
