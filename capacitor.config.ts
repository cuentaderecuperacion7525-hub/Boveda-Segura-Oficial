import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.calculadora.boveda.privada',
  appName: 'Mi Bóveda',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
      style: 'LIGHT',
    },
  },
};

export default config;
