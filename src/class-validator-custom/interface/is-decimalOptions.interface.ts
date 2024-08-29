export interface IsDecimalOptions {
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
