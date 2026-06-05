import { apiConfig } from '../config/environment';
import type { Product, ProductApiResponse } from '../types/product';

const REQUEST_TIMEOUT_MS = 12000;

const productFields: Array<keyof Product> = [
  'id',
  'reference',
  'name',
  'especieName',
  'categoryName',
  'unitType',
  'stock',
  'observation',
];

function parseUnknownJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function firstProduct(
  payload: ProductApiResponse,
): (Partial<Product> & Record<string, unknown>) | null {
  const normalizedPayload = parseUnknownJson(payload) as ProductApiResponse;

  if (Array.isArray(normalizedPayload)) {
    return normalizedPayload[0] ?? null;
  }

  if (!isRecord(normalizedPayload)) {
    return null;
  }

  if ('data' in normalizedPayload && normalizedPayload.data) {
    const data = parseUnknownJson(normalizedPayload.data) as ProductApiResponse;
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }

    if (!isRecord(data)) {
      return null;
    }

    if (data && typeof data === 'object' && 'data' in data && data.data) {
      const nestedData = parseUnknownJson(data.data) as ProductApiResponse;
      if (Array.isArray(nestedData)) {
        return nestedData[0] ?? null;
      }

      return isRecord(nestedData)
        ? (nestedData as Partial<Product> & Record<string, unknown>)
        : null;
    }

    return data as Partial<Product> & Record<string, unknown>;
  }

  if ('result' in normalizedPayload && normalizedPayload.result) {
    const result = parseUnknownJson(
      normalizedPayload.result,
    ) as ProductApiResponse;
    if (Array.isArray(result)) {
      return result[0] ?? null;
    }

    return isRecord(result)
      ? (result as Partial<Product> & Record<string, unknown>)
      : null;
  }

  if ('products' in normalizedPayload && normalizedPayload.products) {
    return normalizedPayload.products[0] ?? null;
  }

  // Suporte ao padrao {"status":"ok","retorno":[...]}
  const anyPayload = normalizedPayload as Record<string, unknown>;
  if ('retorno' in anyPayload && anyPayload.retorno) {
    const retorno = parseUnknownJson(anyPayload.retorno);
    if (Array.isArray(retorno)) {
      return retorno[0] ?? null;
    }
    if (isRecord(retorno)) {
      return retorno as Partial<Product> & Record<string, unknown>;
    }
  }

  return normalizedPayload as Partial<Product> & Record<string, unknown>;
}

function normalizeProduct(product: Partial<Product> | null): Product {
  const normalized = {} as Product;
  const source = product as (Partial<Product> & Record<string, unknown>) | null;

  productFields.forEach(field => {
    const aliases: Record<keyof Product, string[]> = {
      id: ['id', 'cd_produto', 'codigo_produto'],
      reference: ['reference', 'referencia', 'codigo', 'code', 'cd_produto'],
      name: ['name', 'nome', 'ds_produto', 'descricao', 'description'],
      especieName: [
        'especie',
        'especie',
        'species',
        'especieName',
        'speciesName',
        'ds_especie',
        'nm_especie',
      ],
      categoryName: [
        'categoryName',
        'categoria',
        'ds_categoria',
        'nm_categoria',
      ],
      unitType: [
        'unitType',
        'unit_type',
        'ds_unidade',
        'unidade',
        'tp_unidade',
      ],
      stock: ['stock', 'estoque', 'qt_estoque', 'saldo'],
      observation: [
        'observation',
        'observacao',
        'observações',
        'observacaoes',
        'observacoes',
        'obs',
        'ds_observacao',
        'ds_observacoes',
      ],
    };
    const matchedAlias = aliases[field].find(alias => {
      const item = source?.[alias];
      return item !== undefined && item !== null && item !== '';
    });

    const value = matchedAlias ? source?.[matchedAlias] : undefined;

    if (__DEV__ && field === 'observation') {
      const knownKeys = source ? Object.keys(source) : [];
      // Loga o alias exato usado para facilitar ajuste fino dos mapeamentos da API.
      console.log(
        '[productService] observation alias:',
        matchedAlias ?? 'none',
      );
      console.log('[productService] payload keys:', knownKeys.join(', '));
    }

    normalized[field] =
      value === undefined || value === null || value === ''
        ? '-'
        : String(value);
  });

  return normalized;
}

function buildRequestTargets(code: string) {
  const params = new URLSearchParams({
    class: apiConfig.productServiceClass,
    method: apiConfig.productServiceMethod,
    [apiConfig.productCodeParam]: code,
  });

  const baseUrls = [apiConfig.baseUrl, ...(apiConfig.fallbackBaseUrls ?? [])];
  const uniqueBaseUrls = [...new Set(baseUrls)];

  return {
    params,
    targets: uniqueBaseUrls.map(baseUrl => ({
      baseUrl,
      getUrl: `${baseUrl}?${params.toString()}`,
    })),
  };
}

async function fetchWithFallbackTargets(
  targets: Array<{ baseUrl: string; getUrl: string }>,
  params: URLSearchParams,
) {
  let lastHttpResponse: Response | null = null;
  let lastNetworkError: Error | null = null;

  for (const target of targets) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      let response = await fetch(target.getUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (response.status === 403 || response.status === 405) {
        response = await fetch(target.baseUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          body: params.toString(),
        });
      }

      if (response.ok) {
        return response;
      }

      lastHttpResponse = response;
    } catch (error) {
      const casted = error as Error;
      if (casted.name === 'AbortError') {
        lastNetworkError = new Error(
          'Tempo limite ao consultar API. Verifique IP/porta do backend e conectividade da rede.',
        );
      } else {
        lastNetworkError = casted;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastHttpResponse) {
    return lastHttpResponse;
  }

  if (lastNetworkError) {
    const attempted = targets.map(t => t.baseUrl).join(', ');
    throw new Error(
      `Falha de rede ao consultar API. Enderecos tentados: ${attempted}`,
    );
  }

  throw new Error('Falha de rede ao consultar API.');
}

export async function getProductByBarcode(code: string): Promise<Product> {
  const { params, targets } = buildRequestTargets(code);

  let response: Response;
  try {
    response = await fetchWithFallbackTargets(targets, params);
  } catch (error) {
    throw error;
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'HTTP 403: Apache negou a requisicao. ' +
          'Configure o Apache/XAMPP para ouvir na porta 8080 ' +
          '(httpd.conf: Listen 8080) e execute: ' +
          'adb reverse tcp:8080 tcp:8080. ' +
          'A porta 80 nao pode ser usada com adb reverse sem root.',
      );
    }

    if (response.status === 503) {
      throw new Error(
        `HTTP 503: Servico de produto indisponivel no endpoint ${
          response.url || apiConfig.baseUrl
        }. ` +
          'Verifique se o backend esta ativo e se o endpoint de producao esta correto.',
      );
    }

    throw new Error(`Falha ao consultar produto: HTTP ${response.status}`);
  }

  const rawBody = await response.text();

  // Detecta resposta HTML (página de erro do servidor)
  if (rawBody.trimStart().startsWith('<')) {
    throw new Error(
      'API retornou HTML em vez de JSON. Verifique a URL e configuracao do servidor.',
    );
  }

  let payload: ProductApiResponse;
  try {
    payload = parseUnknownJson(rawBody) as ProductApiResponse;
  } catch {
    throw new Error('Resposta da API em formato invalido (nao JSON).');
  }

  const rawProduct = firstProduct(payload);
  const product = normalizeProduct(rawProduct);

  if (product.id === '-' && product.reference === '-' && product.name === '-') {
    // Inclui estrutura real para diagnóstico de campos
    const preview =
      rawBody.length > 400 ? rawBody.slice(0, 400) + '...' : rawBody;
    throw new Error(
      `Produto nao encontrado. Verifique os nomes dos campos retornados pela API.\nResposta recebida: ${preview}`,
    );
  }

  return product;
}
