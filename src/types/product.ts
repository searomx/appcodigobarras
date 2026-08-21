export type Product = {
  id: string;
  reference: string;
  numberPallet: string;
  name: string;
  especieName: string;
  categoryName: string;
  unitType: string;
  stock: string;
  observation: string;
};

export type ProductApiResponse =
  | Product
  | Product[]
  | {
      data?: Product | Product[];
      result?: Product | Product[];
      products?: Product[];
    };
