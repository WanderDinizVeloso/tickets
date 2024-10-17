import { CustomDecorator, SetMetadata } from '@nestjs/common';

import { IS_PUBLIC_KEY } from '../constants.util';

export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);
