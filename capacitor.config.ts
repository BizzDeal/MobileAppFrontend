import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bizz-deal-FE',
  webDir: 'www',
  plugins: {
    Keyboard: {
      resize: 'ionic', // or 'body' or 'native'
      style: 'dark' // optional
    }
  }
};

export default config;
