import { useQuery } from '@tanstack/react-query';

import { getProductByBarcode } from '../services/productService';

export function useProductQuery(code: string | null) {
  return useQuery({
    queryKey: ['product', code],
    queryFn: () => getProductByBarcode(code!),
    enabled: Boolean(code),
  });
}
