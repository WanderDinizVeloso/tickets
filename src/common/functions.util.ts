import { ITransformExecParam } from './interfaces/common.interface';

export const booleanArrayTransform = ({ value }: ITransformExecParam): boolean[] => [
  !!['true', 'TRUE', '1'].includes(value),
];

export const stringArrayTransform = ({ value }: ITransformExecParam): string[] => value?.split(',');
