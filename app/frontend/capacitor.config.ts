import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.posturepal.app',
  appName: 'PosturePal',
  webDir: 'build',
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['192.168.15.4']
  }
};

export default config;
