import { getProductByBarcode } from '../src/services/productService';

describe('getProductByBarcode', () => {
  it('keeps numberPallet mapped right after reference', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            id: '123',
            reference: 'REF-001',
            numberPallet: 'PAL-900',
            name: 'Produto Teste',
            especieName: 'Pinus',
            categoryName: 'Madeira',
            unitType: 'UN',
            stock: '10',
            observation: 'ok',
          },
        }),
    });

    global.fetch = fetchMock as typeof fetch;

    const product = await getProductByBarcode('123');

    expect(product.reference).toBe('REF-001');
    expect(product.numberPallet).toBe('PAL-900');
  });

  it('maps pallet fields even when the backend sends case-insensitive variants', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            id: '456',
            reference: 'REF-002',
            NUM_PALLET: 'PAL-777',
            name: 'Produto Teste 2',
            especieName: 'Eucalipto',
            categoryName: 'Madeira',
            unitType: 'MT',
            stock: '5',
            observation: 'ok',
          },
        }),
    });

    global.fetch = fetchMock as typeof fetch;

    const product = await getProductByBarcode('456');

    expect(product.numberPallet).toBe('PAL-777');
  });
});
