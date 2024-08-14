import { IError, IErrorResponse } from './common-interceptors.interface';

interface IInvalidIdInterceptorWithMethodsPublics {
  isInvalidId?: (error: IError) => boolean;
  errorResponse?: (error: IError) => IErrorResponse;
}

export { IInvalidIdInterceptorWithMethodsPublics };
