import AsyncStorage from '@react-native-async-storage/async-storage';
import Hex from 'crypto-js/enc-hex';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import { Platform } from 'react-native';

import { apiConfig } from '../config/environment';

const REQUEST_TIMEOUT_MS = 12000;
const LOGOUT_QUEUE_STORAGE_KEY = '@mw/logoutQueue';
const MAX_QUEUE_SIZE = 200;

type LogoutPayload = {
  userName: string | null;
  reason: string | null;
  timestamp: number;
};

type StoredLogoutPayload = LogoutPayload & {
  queuedAt: number;
  attempts: number;
};

function getTargets() {
  const baseUrls = [apiConfig.baseUrl, ...(apiConfig.fallbackBaseUrls ?? [])];
  return [...new Set(baseUrls)];
}

function buildParams(payload: LogoutPayload) {
  const logoutAt = new Date(payload.timestamp).toISOString();
  const signatureBase = [
    payload.userName ?? '',
    payload.reason ?? 'unknown',
    logoutAt,
    Platform.OS,
  ].join('|');
  const signature = hmacSHA256(
    signatureBase,
    apiConfig.logoutHmacSecret,
  ).toString(Hex);

  return new URLSearchParams({
    class: apiConfig.logoutServiceClass,
    method: apiConfig.logoutServiceMethod,
    user: payload.userName ?? '',
    login: payload.userName ?? '',
    reason: payload.reason ?? 'unknown',
    platform: Platform.OS,
    logoutAt,
    sigAlg: apiConfig.logoutHmacAlgo,
    sig: signature,
  });
}

async function loadQueue(): Promise<StoredLogoutPayload[]> {
  try {
    const value = await AsyncStorage.getItem(LOGOUT_QUEUE_STORAGE_KEY);
    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value) as StoredLogoutPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: StoredLogoutPayload[]) {
  await AsyncStorage.setItem(LOGOUT_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

async function enqueueLogout(payload: LogoutPayload) {
  const queue = await loadQueue();
  const nextQueue = [
    ...queue,
    {
      ...payload,
      queuedAt: Date.now(),
      attempts: 0,
    },
  ].slice(-MAX_QUEUE_SIZE);
  await saveQueue(nextQueue);
}

async function sendToAnyTarget(payload: LogoutPayload): Promise<void> {
  const params = buildParams(payload);
  const targets = getTargets();

  let lastError: Error | null = null;

  for (const baseUrl of targets) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: params.toString(),
      });

      if (response.ok) {
        return;
      }

      lastError = new Error(
        `Falha ao registrar logout: HTTP ${response.status} em ${baseUrl}`,
      );
    } catch (error) {
      const casted = error as Error;
      lastError =
        casted.name === 'AbortError'
          ? new Error('Tempo limite ao enviar logout para API.')
          : casted;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Falha ao registrar logout.');
}

export async function flushQueuedLogouts(): Promise<void> {
  const queue = await loadQueue();
  if (queue.length === 0) {
    return;
  }

  const pending: StoredLogoutPayload[] = [];

  for (const item of queue) {
    try {
      await sendToAnyTarget(item);
    } catch {
      pending.push({
        ...item,
        attempts: item.attempts + 1,
      });
    }
  }

  await saveQueue(pending.slice(-MAX_QUEUE_SIZE));
}

export async function notifyLogout(payload: LogoutPayload): Promise<void> {
  try {
    await sendToAnyTarget(payload);
    await flushQueuedLogouts();
  } catch (error) {
    await enqueueLogout(payload);
    throw error;
  }
}
