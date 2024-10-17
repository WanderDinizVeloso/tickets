import { Module } from '@nestjs/common';
import { EncryptService } from './encrypt.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EncryptService],
  exports: [EncryptService],
})
export class EncryptModule {}
