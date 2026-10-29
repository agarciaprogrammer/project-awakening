import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Expose on the LAN so the app can be opened from an iPhone on the same network.
  server: { host: true },
});
