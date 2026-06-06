import { apiConfig } from '../config/environment';

const REQUEST_TIMEOUT_MS = 12000;

type LoginCredentials = {
  login: string;
  password: string;
};

type AuthenticatedUser = {
  name: string;
};

type AuthPayload = Record<string, unknown>;

function parseUnknownJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is AuthPayload {
  return typeof value === 'object' && value !== null;
}

function valueAsString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getAuthTargets() {
  const baseUrls = [apiConfig.baseUrl, ...(apiConfig.fallbackBaseUrls ?? [])];

  return [...new Set(baseUrls)];
}

function buildAuthUrl(baseUrl: string, credentials: LoginCredentials) {
  const params = new URLSearchParams({
    class: apiConfig.authServiceClass,
    method: apiConfig.authServiceMethod,
    login: credentials.login,
    password: credentials.password,
  });

  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`;
}

async function getCredentials(baseUrl: string, credentials: LoginCredentials) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const requestUrl = buildAuthUrl(baseUrl, credentials);

  try {
    return await fetch(requestUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponse(response: Response) {
  const rawBody = await response.text();
  return {
    rawBody,
    payload: parseUnknownJson(rawBody),
  };
}

function findUserName(payload: unknown, fallbackName: string) {
  if (!isRecord(payload)) {
    return fallbackName;
  }

  const directName =
    valueAsString(payload.name) ||
    valueAsString(payload.nome) ||
    valueAsString(payload.userName) ||
    valueAsString(payload.username) ||
    valueAsString(payload.login);

  if (directName) {
    return directName;
  }

  const nestedUser = payload.user || payload.usuario || payload.data;
  if (isRecord(nestedUser)) {
    return findUserName(nestedUser, fallbackName);
  }

  return fallbackName;
}

function findMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return '';
  }

  return (
    valueAsString(payload.message) ||
    valueAsString(payload.mensagem) ||
    valueAsString(payload.error) ||
    valueAsString(payload.erro)
  );
}

function isAuthenticatedPayload(payload: unknown) {
  if (!isRecord(payload)) {
    return true;
  }

  const status = valueAsString(payload.status).toLowerCase();
  const result = valueAsString(payload.result).toLowerCase();

  if (
    payload.authenticated === false ||
    payload.success === false ||
    payload.valid === false ||
    status === 'error' ||
    status === 'erro' ||
    status === 'false' ||
    result === 'error' ||
    result === 'erro' ||
    result === 'false'
  ) {
    return false;
  }

  return true;
}

function buildHttpError(response: Response, payload: unknown) {
  const message = findMessage(payload);

  if (response.status === 401 || response.status === 403) {
    return message || 'Login ou senha invalidos.';
  }

  return message || `Falha ao autenticar: HTTP ${response.status}`;
}

export async function authenticateUser(
  credentials: LoginCredentials,
): Promise<AuthenticatedUser> {
  const targets = getAuthTargets();
  let lastHttpError = '';
  let lastNetworkError: Error | null = null;

  for (const baseUrl of targets) {
    try {
      const response = await getCredentials(baseUrl, credentials);
      const { payload } = await readResponse(response);

      if (response.ok && isAuthenticatedPayload(payload)) {
        return {
          name: findUserName(payload, credentials.login),
        };
      }

      lastHttpError = response.ok
        ? findMessage(payload) || 'Login ou senha invalidos.'
        : buildHttpError(response, payload);
    } catch (error) {
      const casted = error as Error;
      lastNetworkError =
        casted.name === 'AbortError'
          ? new Error('Tempo limite ao autenticar usuario.')
          : casted;
    }
  }

  if (lastHttpError) {
    throw new Error(lastHttpError);
  }

  if (lastNetworkError) {
    throw new Error(
      `Falha de rede ao autenticar. Enderecos tentados: ${targets.join(', ')}`,
    );
  }

  throw new Error('Falha de rede ao autenticar.');
}
