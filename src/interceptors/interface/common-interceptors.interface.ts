interface IError {
  index?: number;
  code?: number;
  keyValue?: JSON;
  message?: string;
  messageFormat?: string;
  stringValue?: string;
  value?: string;
  path?: string;
  kind?: string;
}

interface IResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}

interface IErrorResponse {
  response?: IResponse;
}

export { IError, IResponse, IErrorResponse };
