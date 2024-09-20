import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { IError } from './interface/common-interceptors.interface';

@Injectable()
export class UniqueAttributeInterceptor implements NestInterceptor {
  private isUniqueAttribute(error: IError): boolean {
    return error.message.includes('duplicate key error');
  }

  private errorResponse(error: IError): Observable<void> {
    return this.isUniqueAttribute(error)
      ? throwError(
          () =>
            new BadRequestException(
              `${Object.keys(error.keyValue).join(', ')} attribute(s) must be unique.`,
            ),
        )
      : throwError(() => error);
  }

  intercept(_context: ExecutionContext, next: CallHandler): Observable<void> {
    return next.handle().pipe(catchError((error) => this.errorResponse(error)));
  }
}
