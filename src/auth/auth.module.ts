import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EncryptModule } from '../encrypt/encrypt.module';
import { MailModule } from '../mail/mail.module';
import { RefreshToken, RefreshTokenSchema } from './schema/refresh-token.schema';
import { ResetToken, ResetTokenSchema } from './schema/reset-token.schema';
import { User, UserSchema } from './schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: ResetToken.name, schema: ResetTokenSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EncryptModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [],
})
export class AuthModule {}
