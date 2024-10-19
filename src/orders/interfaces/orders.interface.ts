export interface IOrderPayloadAcc {
  payload: IOrderPayload;
  products: Record<string, IProduct>;
}

export interface IOrderPayload {
  products: IProduct[];
  total: string;
}

export interface IProduct {
  name?: string;
  price?: string;
  id?: string;
  quantity?: string;
  total?: string;
}
