import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { CardsModule } from './cards/cards.module';
import { AuthenticationGuard } from './guards/authentication.guard';
import { EncryptModule } from './encrypt/encrypt.module';
import { MonetaryDataModule } from './monetary-data/monetary-data.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_AFTER_SECONDS) },
    }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    CardsModule,
    EncryptModule,
    MonetaryDataModule,
    OrdersModule,
    ProductsModule,
    TenantsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  exports: [],
})
export class AppModule {}
