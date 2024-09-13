import { Module } from '@nestjs/common';

import { MonetaryDataService } from './monetary-data.service';

@Module({
  imports: [],
  controllers: [],
  providers: [MonetaryDataService],
  exports: [MonetaryDataService],
})
export class MonetaryDataModule {}
