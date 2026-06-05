import { Platform } from 'react-native';

const endpointPath = '/rest.php';
const primaryProductionHost = 'www.masterwood.app.br';
const secondaryProductionHost = 'www.masterwood.app.br';
const productionBaseUrl = `https://${primaryProductionHost}${endpointPath}`;
const productionFallbackBaseUrls = [
  `https://${secondaryProductionHost}${endpointPath}`,
];

const androidDevApiPort = 8080;

type AndroidDevApiMode = 'emulator' | 'wifi-device' | 'usb-reverse';

const androidDevApiMode: AndroidDevApiMode = 'usb-reverse';
const androidDevWifiHost = '129.121.36.213';

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
  productCodeParam: 'codigo',
  productServiceClass: 'ProductService',
  productServiceMethod: 'getProdutos',
};
