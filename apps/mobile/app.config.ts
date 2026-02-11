import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ContaLink',
  slug: 'contalink',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'contalink',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.contalink.app',
    infoPlist: {
      NSCameraUsageDescription: 'ContaLink necesita acceso a la cámara para escanear facturas y documentos tributarios.',
      NSPhotoLibraryUsageDescription: 'ContaLink necesita acceso a tu galería para subir fotos de facturas.',
      NSPhotoLibraryAddUsageDescription: 'ContaLink necesita permiso para guardar fotos de facturas.'
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.contalink.app',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.INTERNET'
    ]
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission: 'ContaLink necesita acceso a tu galería para subir fotos de facturas.',
        cameraPermission: 'ContaLink necesita acceso a la cámara para escanear facturas.'
      }
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'ContaLink necesita acceso a la cámara para escanear facturas y documentos tributarios.'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {
      origin: false
    },
    eas: {
      projectId: 'contalink-project-id' // Reemplazar con tu EAS project ID
    }
  }
});
