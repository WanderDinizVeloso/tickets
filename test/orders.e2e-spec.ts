/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId, UUID } from 'mongodb';
import * as request from 'supertest';

import { name as DB_NAME } from '../package.json';
import { AuthModule } from '../src/auth/auth.module';
import { EncryptModule } from '../src/encrypt/encrypt.module';
import { AuthenticationGuard } from '../src/guards/authentication.guard';
import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { OrdersModule } from '../src/orders/orders.module';
import { MongoInMemory } from './utils/mongo-memory-server';

const FIRST_ELEMENT = 0;

describe('Orders (e2e)', () => {
  let app: INestApplication;

  let token: string;

  const dateTest = new Date().toISOString();

  const server = new MongoInMemory();

  const productPayload1 = { name: 'test', price: '1.65' };

  const productPayload2 = { name: 'test2', price: '2.36' };

  beforeEach(async () => {
    await server.start();

    const uri = server.getURI();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: Number(process.env.JWT_EXPIRES_AFTER_SECONDS) },
        }),
        MongooseModule.forRoot(uri),
        AuthModule,
        EncryptModule,
        OrdersModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthenticationGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    app.useGlobalInterceptors(new InvalidIdInterceptor(), new UniqueAttributeInterceptor());

    await app.init();

    const authPayload = {
      name: 'teste',
      email: 'teste@teste.com',
      password: 'Teste123!',
    };

    await request(app.getHttpServer()).post('/auth/sign-up').send(authPayload);

    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: authPayload.email, password: authPayload.password });

    token = body.accessToken;
  });

  afterEach(async () => {
    await server.stop();

    await app.close();
  });

  describe('POST -> /orders', () => {
    it('should return status code 201 (Created) when the ordersPayload is correct.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the ordersPayload is correct.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      if (body?.id && typeof body.id === 'string') {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        id: 'idTest',
        message: 'order created successfully.',
        statusCode: 201,
      });
    });

    it('should return status code 401 (Unauthorized) when the Bearer Token is missing.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer()).post('/orders').send(ordersPayload);

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Bearer Token is missing.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer()).post('/orders').send(ordersPayload);

      if (body?.id && typeof body.id === 'string') {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'orders' attribute.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when ordersPayload does not have 'orders' attribute.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(body).toStrictEqual({
        message: ['products must be an array', 'products should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'products id' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when ordersPayload does not have 'products id' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(body).toStrictEqual({
        message: ['products.0.id attribute is invalid.', 'products.0.id should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products id' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ id: '', quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'products id' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ id: '', quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(body).toStrictEqual({
        message: ['products.0.id attribute is invalid.', 'products.0.id should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'products quantity' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the ordersPayload is missing the 'products quantity' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [productsWithoutQuantity] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
          'products.0.quantity should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'products quantity' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
          'products.0.quantity should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: 0 }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = 0).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: 0 }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = 1).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: 1 }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = 1).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: 1 }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '0' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '0' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.0' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.0' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.00').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.00' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.00').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.00' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1,000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1,000' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1,000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1,000' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.0000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.0000' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.0000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '0.300',
          },
        ],
      };

      const { quantity, ...productsWithoutQuantity } = ordersPayload.products[FIRST_ELEMENT];

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ products: [{ ...productsWithoutQuantity, quantity: '1.0000' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.quantity attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`must return status code 400 (Bad Request) when a product in the order's product list does not exist in the registry.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: new UUID().toString(),
            quantity: '0.200',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when a product in the order's product list does not exist in the registry.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ProductNotRegisteredId1 = new ObjectId().toString();

      const ProductNotRegisteredId2 = new ObjectId().toString();

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: ProductNotRegisteredId1,
            quantity: '0.200',
          },
          {
            id: ProductNotRegisteredId2,
            quantity: '0.100',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      expect(body).toStrictEqual({
        message: `there are products not registered in the order list. id(s): ${[ProductNotRegisteredId1, ProductNotRegisteredId2].join(', ')}`,
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when there are duplicate productIds in the product list.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody1.id,
            quantity: '0.200',
          },
        ],
      };

      const { statusCode } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when there are duplicate productIds in the product list.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody1.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      expect(body).toStrictEqual({
        message: `there are repeated productIds in the products list. id(s): ${[productBody1.id].join(', ')}`,
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the order in the database.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const order = await client
        .db(DB_NAME)
        .collection('orders')
        .findOne(ObjectId.createFromHexString(body.id));

      await client.close();

      if (order?.createdAt) {
        order.createdAt = dateTest;
      }

      if (order?.updatedAt) {
        order.updatedAt = dateTest;
      }

      expect(order).toStrictEqual({
        _id: ObjectId.createFromHexString(body.id),
        active: true,
        products: [
          {
            id: productBody1.id,
            name: 'test',
            price: '1.650000000000000000000000000000000',
            quantity: '0.300000000000000000000000000000000',
            total: '0.495000000000000000000000000000000',
          },
          {
            id: productBody2.id,
            name: 'test2',
            price: '2.360000000000000000000000000000000',
            quantity: '0.200000000000000000000000000000000',
            total: '0.472000000000000000000000000000000',
          },
        ],
        total: '0.967000000000000000000000000000000',
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('GET -> /orders', () => {
    it('should return status code 200 (OK).', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered order.', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual([]);
    });

    it('should return status code 401 (Unauthorized) when the Bearer Token is missing.', async () => {
      const { statusCode } = await request(app.getHttpServer()).get('/orders');

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Bearer Token is missing.', async () => {
      const { body } = await request(app.getHttpServer()).get('/orders');

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it('must return an array with one element when creating a order.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: getBody } = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '0.300',
              total: '0.50',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '0.200',
              total: '0.47',
            },
          ],
          total: '0.97',
        },
      ]);
    });

    it(`should return an array with one element when adding only one productId in the 'id' query.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody1.id,
            quantity: '1.300',
          },
          {
            id: productBody2.id,
            quantity: '3.500',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload2);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/orders?id=${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '0.300',
              total: '0.50',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '0.200',
              total: '0.47',
            },
          ],
          total: '0.97',
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than productId in the 'id' query.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody1.id,
            quantity: '1.300',
          },
          {
            id: productBody2.id,
            quantity: '3.500',
          },
        ],
      };

      const ordersPayload3 = {
        products: [
          {
            id: productBody1.id,
            quantity: '3.200',
          },
          {
            id: productBody2.id,
            quantity: '6.780',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload2);

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload3);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/orders?id=${postBody.id},${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '0.300',
              total: '0.50',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '0.200',
              total: '0.47',
            },
          ],
          total: '0.97',
        },
        {
          id: postBody2.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '1.300',
              total: '2.14',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '3.500',
              total: '8.26',
            },
          ],
          total: '10.40',
        },
      ]);
    });

    it(`should return an array with one inactive element when adding 'false' to the 'active' query.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody1.id,
            quantity: '1.300',
          },
          {
            id: productBody2.id,
            quantity: '3.500',
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload2);

      await request(app.getHttpServer())
        .delete(`/orders/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/orders?active=false`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody2.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '1.300',
              total: '2.14',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '3.500',
              total: '8.26',
            },
          ],
          total: '10.40',
        },
      ]);
    });

    it(`should return an array with one active element when adding 'true' to the 'active' query.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody1.id,
            quantity: '1.300',
          },
          {
            id: productBody2.id,
            quantity: '3.500',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload2);

      await request(app.getHttpServer())
        .delete(`/orders/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/orders?active=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          products: [
            {
              id: productBody1.id,
              name: 'test',
              price: '1.65',
              quantity: '0.300',
              total: '0.50',
            },
            {
              id: productBody2.id,
              name: 'test2',
              price: '2.36',
              quantity: '0.200',
              total: '0.47',
            },
          ],
          total: '0.97',
        },
      ]);
    });
  });

  describe('GET -> /orders/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { statusCode } = await request(app.getHttpServer())
        .get(`/orders/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct order when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/orders/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual({
        id: postBody.id,
        products: [
          {
            id: productBody1.id,
            name: 'test',
            price: '1.65',
            quantity: '0.300',
            total: '0.50',
          },
          {
            id: productBody2.id,
            name: 'test2',
            price: '2.36',
            quantity: '0.200',
            total: '0.47',
          },
        ],
        total: '0.97',
      });
    });

    it(`should return status code 401 (Unauthorized) when the Bearer Token is missing.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { statusCode } = await request(app.getHttpServer()).get(`/orders/${body.id}`);

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the Bearer Token is missing.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: getBody } = await request(app.getHttpServer()).get(`/orders/${postBody.id}`);

      expect(getBody).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it(`should return status code 400 (Bad Request) when the order with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get(`/orders/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the order with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/orders/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'order does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get(`/orders/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/orders/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('DELETE -> /orders/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { statusCode } = await request(app.getHttpServer())
        .delete(`/orders/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: delBody } = await request(app.getHttpServer())
        .delete(`/orders/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delBody).toStrictEqual({
        id: postBody.id,
        message: 'order deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 401 (Unauthorized) when the Bearer Token is missing.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { statusCode } = await request(app.getHttpServer()).delete(`/orders/${body.id}`);

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the Bearer Token is missing.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: productBody2.id,
            quantity: '0.200',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      const { body: delBody } = await request(app.getHttpServer()).delete(`/orders/${postBody.id}`);

      expect(delBody).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it(`should return status code 400 (Bad Request) when the order with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .delete(`/orders/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the order with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/orders/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'order does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .delete(`/orders/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/orders/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the order from the database.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody2.id,
            quantity: '0.200',
          },
          {
            id: productBody1.id,
            quantity: '0.300',
          },
        ],
      };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(ordersPayload);

      await request(app.getHttpServer())
        .delete(`/orders/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const product = await client
        .db(DB_NAME)
        .collection('orders')
        .findOne(ObjectId.createFromHexString(postBody.id));

      await client.close();

      if (product?.createdAt) {
        product.createdAt = dateTest;
      }

      if (product?.updatedAt) {
        product.updatedAt = dateTest;
      }

      expect(product).toStrictEqual({
        _id: ObjectId.createFromHexString(postBody.id),
        active: false,
        products: [
          {
            id: productBody1.id,
            name: 'test',
            price: '1.650000000000000000000000000000000',
            quantity: '0.300000000000000000000000000000000',
            total: '0.495000000000000000000000000000000',
          },
          {
            id: productBody2.id,
            name: 'test2',
            price: '2.360000000000000000000000000000000',
            quantity: '0.200000000000000000000000000000000',
            total: '0.472000000000000000000000000000000',
          },
        ],
        total: '0.967000000000000000000000000000000',
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
