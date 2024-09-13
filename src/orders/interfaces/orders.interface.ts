export interface IOrderPayloadAcc {
  payload: IPayload;
  products: Record<string, IProduct>;
}

export interface IOrdersResponse {
  id: string;
  message: string;
  statusCode: number;
}

export interface IPayload {
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
