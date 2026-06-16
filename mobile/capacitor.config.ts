import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dailyos.app',
  appName: 'DailyOS',
  webDir: '../client/dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  }
};

export default config;
