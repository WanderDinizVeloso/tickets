import { Injectable } from '@nestjs/common';

import { Decimal128 } from '../decimal128/decimal128.decimal128';

const THIRTY_FOUR_DIGITS = 34;

@Injectable()
export class MonetaryDataService {
  add(values: string[]): string {
    return values.reduce((acc: string, value: string) => {
      acc = this.setToPrecision34Digits(new Decimal128(acc).add(new Decimal128(value)));

      return acc;
    }, '0.00');
  }

  multiply(values: string[]): string {
    return values.reduce((acc: string, value: string) => {
      acc = this.setToPrecision34Digits(new Decimal128(acc).multiply(new Decimal128(value)));

      return acc;
    }, '1');
  }

  getToFixedDigits(value: string, digits: number): string {
    return new Decimal128(value).toFixed({ digits });
  }

  setToPrecision34Digits(value: string | Decimal128): string {
    if (typeof value === 'string') {
      return new Decimal128(value).toPrecision({ digits: THIRTY_FOUR_DIGITS });
    }

    return value.toPrecision({ digits: THIRTY_FOUR_DIGITS });
  }
}
