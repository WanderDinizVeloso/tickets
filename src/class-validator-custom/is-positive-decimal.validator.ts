import { registerDecorator, ValidationOptions, isDecimal } from 'class-validator';

const FIRST_POSITION = 0;

const ONE_DIGIT_DECIMAL = 1;

interface IsDecimalOptions {
  /**
   * @default true
   */
  force_decimal?: boolean | undefined;
  /**
   * `decimal_digits` is given as a range like `'1,3'`,
   * a specific value like `'3'` or min like `'1,'`
   *
   * @default '1'
   */
  decimal_digits?: string | undefined;
}

/**
 * Checks if the string is a valid positive decimal.
 * If given value is not a string, then it returns false.
 */
export const IsPositiveDecimal =
  (
    options?: IsDecimalOptions,
    validationOptions: ValidationOptions = {
      message: ({ property }) =>
        `The '${property}' attribute is not a valid positive decimal number. It must be a string, positive and contain a ${Number(options?.decimal_digits) || ONE_DIGIT_DECIMAL} digit decimal separated by a period. ex.: '1.${Array.from(Array(Number(options?.decimal_digits) || ONE_DIGIT_DECIMAL).keys()).join('')}'.`,
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
