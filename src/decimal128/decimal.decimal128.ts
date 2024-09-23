/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Rational } from './racional.decimal128';

const ratOne = new Rational(1n, 1n);
const ratTen = new Rational(10n, 1n);

function _cohort(s: string): '0' | '-0' | Rational {
  if (s.match(/^-/)) {
    const c = _cohort(s.substring(1));

    if (c === '0') {
      return '-0';
    }

    return (c as Rational).negate();
  }

  if (s.match(/^00+/)) {
    return _cohort(s.substring(1));
  }

  if (s.match(/^0([.]0+)?$/)) {
    return '0';
  }

  if (s.match(/^0[eE][+-]?[0-9]+$/)) {
    return '0';
  }

  return Rational.fromString(s);
}

function _quantum(s: string): number {
  if (s.match(/^-/)) {
    return _quantum(s.substring(1));
  }

  if (s.match(/[.]/)) {
    const [_, rhs] = s.split('.');

    if (rhs.match(/[eE]/)) {
      const [dec, exp] = rhs.split(/[eE]/);
      return parseInt(exp) - dec.length;
    }

    return 0 - rhs.length;
  }

  if (s.match(/[eE]/)) {
    const [dec, exp] = s.split(/[eE]/);
    return parseInt(exp);
  }

  return 0;
}

interface CohortAndQuantum {
  cohort: '0' | '-0' | Rational;
  quantum: number;
}

export class Decimal {
  public readonly cohort: '0' | '-0' | Rational;
  public readonly quantum: number;

  constructor(x: string | CohortAndQuantum) {
    const v = typeof x === 'string' ? _cohort(x) : x.cohort;
    const q = typeof x === 'string' ? _quantum(x) : x.quantum;

    if (v instanceof Rational && v.isZero()) {
      throw new RangeError('a rational number cohort must not be zero.');
    }

    if (!Number.isInteger(q)) {
      throw new RangeError('quantum must be an integer.');
    }

    if (Object.is(q, -0)) {
      throw new RangeError('quantum cannot be negative zero.');
    }

    this.cohort = v;
    this.quantum = q;
  }

  public negate(): Decimal {
    const v = this.cohort as Rational;

    return new Decimal({
      cohort: v.negate(),
      quantum: this.quantum,
    });
  }

  public coefficient(): bigint {
    const v = this.cohort as Rational;
    const q = this.quantum;
    const c = v.scale10(0 - q);
    return c.numerator;
  }

  isNegative(): boolean {
    const v = this.cohort as Rational;
    return v.isNegative;
  }
}
