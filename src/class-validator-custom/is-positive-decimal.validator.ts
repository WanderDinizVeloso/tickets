import { registerDecorator, ValidationOptions, isDecimal } from 'class-validator';
import * as ValidatorJS from 'validator';

const FIRST_POSITION = 0;

/**
 * Checks if the string is a valid positive decimal.
 * If given value is not a string, then it returns false.
 */
export const IsPositiveDecimal =
  (
    options?: ValidatorJS.IsDecimalOptions,
    validationOptions: ValidationOptions = {
      message: ({ property }) =>
        `The '${property}' attribute is not a valid positive decimal number. It must be a string, positive and contain a two-digit decimal separated by a period. ex.: '1.65'.`,
    },
  ) =>
  (object: unknown, propertyName: string): void => {
    registerDecorator({
      name: 'IsPositiveDecimal',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [options],
      options: validationOptions,
      validator: {
        validate: (value, args): boolean =>
          isDecimal(value, args?.constraints[FIRST_POSITION]) && !value.includes('-'),
      },
    });
  };
