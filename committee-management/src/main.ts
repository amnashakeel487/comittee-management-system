import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => {
  console.error('Bootstrap error:', err);
  // Show visible error on white screen for debugging
  document.body.innerHTML = `
    <div style="font-family:sans-serif;padding:40px;color:#dc2626;background:#fff">
      <h2>App failed to start</h2>
      <pre style="background:#fee2e2;padding:16px;border-radius:8px;font-size:13px;overflow:auto">${err?.message || err}</pre>
      <p style="color:#666;margin-top:16px">Check the browser console (F12) for full details.</p>
    </div>
  `;
});
