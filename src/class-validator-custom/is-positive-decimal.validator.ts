import { registerDecorator, ValidationOptions, isDecimal } from 'class-validator';

import { FIRST_POSITION, ONE_DIGIT_DECIMAL } from '../common/constants.util';
import { IsDecimalOptions } from './interface/is-decimalOptions.interface';

/**
 * Checks if the string is a valid positive decimal.
 * If given value is not a string, then it returns false.
 */
export const IsPositiveDecimal =
  (
    options?: IsDecimalOptions,
    validationOptions: ValidationOptions = {
      message: ({ property }) =>
        `${property} attribute is not a valid positive decimal number. It must be a string, positive and contain a ${Number(options?.decimal_digits) || ONE_DIGIT_DECIMAL} digit decimal separated by a period. ex.: '1.${Array.from(Array(Number(options?.decimal_digits) || ONE_DIGIT_DECIMAL).keys()).join('')}'.`,
    },
  ) =>
  (object: unknown, propertyName: string): void => {
    registerDecorator({
      name: 'IsPositiveDecimal',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [
        {
          decimal_digits: options?.decimal_digits || '2',
          force_decimal: options?.force_decimal || true,
        },
      ],
      options: validationOptions,
      validator: {
        validate: (value, args): boolean =>
          isDecimal(value, args?.constraints[FIRST_POSITION]) && !value.includes('-'),
      },
    });
  };
