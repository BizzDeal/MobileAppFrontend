import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'BizzDeal',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'ionic', // or 'body' or 'native'
      style: 'dark' // optional
    }
  }
};

export default config;
