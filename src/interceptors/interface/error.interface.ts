import { IError, IErrorResponse } from './common-interceptors.interface';

interface IErrorInterceptorWithMethodsPublics {
  isInvalidId?: (error: IError) => boolean;
  errorResponse?: (error: IError) => IErrorResponse;
}

export { IErrorInterceptorWithMethodsPublics };
