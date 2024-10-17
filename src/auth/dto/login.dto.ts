import { PickType } from '@nestjs/swagger';

import { SignUpDto } from './sign-up.dto';

export class LoginDto extends PickType(SignUpDto, ['email', 'password'] as const) {}
