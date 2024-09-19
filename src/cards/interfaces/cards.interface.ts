export interface ICardPayload {
  productId: string;
  orderId: string;
  name: string;
  price: string;
  quantity: string;
}

export interface ICardsCreateResponse {
  ids: string[];
  message: string;
  statusCode: number;
}

export interface ICardDeleteResponse {
  id: string;
  message: string;
  statusCode: number;
}

export interface ICardsTransformExecParam {
  value: string;
}
