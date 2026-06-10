import { Platform } from 'react-native';

type Environment = Partial<{
  API_ENDPOINT_PATH: string;
  API_PRIMARY_PRODUCTION_HOST: string;
  API_SECONDARY_PRODUCTION_HOST: string;
  ANDROID_DEV_API_MODE: AndroidDevApiMode;
  ANDROID_DEV_API_PORT: string;
  ANDROID_DEV_WIFI_HOST: string;
  AUTH_SERVICE_CLASS: string;
  AUTH_SERVICE_METHOD: string;
  PRODUCT_CODE_PARAM: string;
  PRODUCT_SERVICE_CLASS: string;
  PRODUCT_SERVICE_METHOD: string;
  LOGOUT_SERVICE_CLASS: string;
  LOGOUT_SERVICE_METHOD: string;
  LOGOUT_HMAC_SECRET: string;
  LOGOUT_HMAC_ALGO: string;
}>;

declare const process:
  | {
      env?: Environment;
    }
  | undefined;

type AndroidDevApiMode = 'emulator' | 'wifi-device' | 'usb-reverse';

const env = typeof process !== 'undefined' ? process.env ?? {} : {};

const endpointPath = env.API_ENDPOINT_PATH || '/rest.php';
const primaryProductionHost =
  env.API_PRIMARY_PRODUCTION_HOST || 'www.masterwood.app.br';
const secondaryProductionHost =
  env.API_SECONDARY_PRODUCTION_HOST || 'www.masterwood.app.br';
const productionBaseUrl = `https://${primaryProductionHost}${endpointPath}`;
const productionFallbackBaseUrls = [
  `https://${secondaryProductionHost}${endpointPath}`,
];

const androidDevApiPort = env.ANDROID_DEV_API_PORT
  ? Number(env.ANDROID_DEV_API_PORT)
  : 8080;

const androidDevApiMode: AndroidDevApiMode =
  env.ANDROID_DEV_API_MODE || 'usb-reverse';
const androidDevWifiHost = env.ANDROID_DEV_WIFI_HOST || '129.121.36.213';

function buildUrl(host: string, port?: number) {
  const portSuffix = port && port !== 80 ? `:${port}` : '';
  return `http://${host}${portSuffix}${endpointPath}`;
}

function getAndroidDevHost() {
  if (androidDevApiMode === 'emulator') {
    return '10.0.2.2';
  }

  if (androidDevApiMode === 'usb-reverse') {
    return 'localhost';
  }

  return androidDevWifiHost;
}

function getDevBaseUrl() {
  if (Platform.OS === 'android') {
    return buildUrl(getAndroidDevHost(), androidDevApiPort);
  }

  return buildUrl('localhost');
}

function getAndroidFallbackBaseUrls(primaryBaseUrl: string) {
  const candidatesByMode: Record<AndroidDevApiMode, string[]> = {
    emulator: [
      buildUrl('10.0.2.2', androidDevApiPort),
      buildUrl(androidDevWifiHost, androidDevApiPort),
    ],
    'wifi-device': [
      buildUrl(androidDevWifiHost, androidDevApiPort),
      buildUrl(androidDevWifiHost),
      buildUrl('localhost', androidDevApiPort),
    ],
    'usb-reverse': [
      buildUrl('localhost', androidDevApiPort),
      buildUrl(androidDevWifiHost, androidDevApiPort),
      buildUrl(androidDevWifiHost),
    ],
  };

  const list = candidatesByMode[androidDevApiMode].filter(
    item => item !== primaryBaseUrl,
  );

  return [...new Set(list)];
}

function getFallbackBaseUrls(primaryBaseUrl: string) {
  if (Platform.OS === 'android' && __DEV__) {
    return [
      ...getAndroidFallbackBaseUrls(primaryBaseUrl),
      productionBaseUrl,
      ...productionFallbackBaseUrls,
    ].filter(url => url !== primaryBaseUrl);
  }

  if (__DEV__) {
    return [productionBaseUrl, ...productionFallbackBaseUrls].filter(
      url => url !== primaryBaseUrl,
    );
  }

  if (!__DEV__) {
    return productionFallbackBaseUrls.filter(url => url !== primaryBaseUrl);
  }

  return [];
}

const baseUrl = __DEV__ ? getDevBaseUrl() : productionBaseUrl;

export const apiConfig = {
  baseUrl,
  fallbackBaseUrls: getFallbackBaseUrls(baseUrl),
  authServiceClass: env.AUTH_SERVICE_CLASS || 'AuthUserService',
  authServiceMethod: env.AUTH_SERVICE_METHOD || 'getUser',
  productCodeParam: env.PRODUCT_CODE_PARAM || 'codigo',
  productServiceClass: env.PRODUCT_SERVICE_CLASS || 'ProductService',
  productServiceMethod: env.PRODUCT_SERVICE_METHOD || 'getProdutos',
  logoutServiceClass: env.LOGOUT_SERVICE_CLASS || 'AuthUserService',
  logoutServiceMethod: env.LOGOUT_SERVICE_METHOD || 'setLogout',
  logoutHmacSecret:
    env.LOGOUT_HMAC_SECRET || '0412e800f2f7bc8d7a77b8c832ac1b5d',
  logoutHmacAlgo: env.LOGOUT_HMAC_ALGO || 'HMAC-SHA256',
};
