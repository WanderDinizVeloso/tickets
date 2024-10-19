import { IError, IErrorResponse } from './common-interceptors.interface';

export interface IErrorInterceptorWithMethodsPublics {
  isInvalidId?: (error: IError) => boolean;
  errorResponse?: (error: IError) => IErrorResponse;
}
