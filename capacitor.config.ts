import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'academy.muhyi.postmanager',
  appName: 'PostManager',
  webDir: 'dist',
  server: {
    // Allow https in WebView (modern Android requirement)
    androidScheme: 'https',
    // For dev: point to dev server (uncomment when developing on device)
    // url: 'http://192.168.1.x:5173',
    // cleartext: true,
  },
  android: {
    // Allow mixed content during dev only (production uses https everywhere)
    allowMixedContent: false,
    // Don't capture taps as native back — let React handle them
    captureInput: true,
  },
}

export default config
