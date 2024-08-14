import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { InvalidIdInterceptor } from './interceptors/invalid-id.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version, name, description } from '../package.json';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new InvalidIdInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('/', app, document);

  await app.listen(process.env.PORT || '3001');
}

bootstrap();
