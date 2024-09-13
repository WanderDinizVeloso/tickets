import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId, UUID } from 'mongodb';
import * as request from 'supertest';

import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { OrdersModule } from '../src/orders/orders.module';
import { ProductsModule } from '../src/products/products.module';
import { MongoInMemory } from './utils/mongo-memory-server';

const FIRST_ELEMENT = 0;

describe('Orders (e2e)', () => {
  let app: INestApplication;

  const dateTest = new Date().toISOString();

  const server = new MongoInMemory();

  const productPayload1 = { name: 'test', price: '1.65' };

  const productPayload2 = { name: 'test2', price: '2.36' };

  beforeEach(async () => {
    await server.start();

    const uri = server.getURI();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), OrdersModule, ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    app.useGlobalInterceptors(new InvalidIdInterceptor(), new UniqueAttributeInterceptor());

    await app.init();
  });

  afterEach(async () => {
    await server.stop();

    await app.close();
  });

  describe('POST -> /orders', () => {
    it('should return status code 201 (Created) when the ordersPayload is correct.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the ordersPayload is correct.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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
        id: 'idTest',
        message: `The order created successfully.`,
        statusCode: 201,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'orders' attribute.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/orders').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when ordersPayload does not have 'orders' attribute.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/orders').send({});

      expect(body).toStrictEqual({
        message: ['products must be an array', 'products should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'products id' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when ordersPayload does not have 'products id' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(body).toStrictEqual({
        message: ['products.0.id must be a mongodb id', 'products.0.id should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products id' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: '', quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'products id' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: '', quantity: ordersPayload.products[FIRST_ELEMENT].quantity }] });

      expect(body).toStrictEqual({
        message: ['products.0.id must be a mongodb id', 'products.0.id should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the ordersPayload is missing the 'products quantity' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the ordersPayload is missing the 'products quantity' attribute.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
          'products.0.quantity should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'products quantity' in the ordersPayload is empty.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
          'products.0.quantity should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: 0 }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = 0).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: 0 }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = 1).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: 1 }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = 1).`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: 1 }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '0' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '0' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.0' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.0').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.0' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.00').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.00' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.00').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.00' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1,000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1,000' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1,000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1,000' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'products quantity' attribute is in the wrong format (quantity = '1.0000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.0000' }] });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'products quantity' attribute is in the wrong format (quantity = '1.0000').`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
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
        .send({ products: [{ id: ordersPayload.products[FIRST_ELEMENT].id, quantity: '1.0000' }] });

      expect(body).toStrictEqual({
        message: [
          `products.0.The 'quantity' attribute is not a valid positive decimal number. It must be a string, positive and contain a 3 digit decimal separated by a period. ex.: '1.012'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`must return status code 400 (Bad Request) when a product in the order's product list does not exist in the registry.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
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

      const { statusCode } = await request(app.getHttpServer()).post('/orders').send(ordersPayload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when a product in the order's product list does not exist in the registry.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '0.300',
          },
          {
            id: new ObjectId().toString(),
            quantity: '0.200',
          },
        ],
      };

      const { body } = await request(app.getHttpServer()).post('/orders').send(ordersPayload);

      expect(body).toStrictEqual({
        message: 'There are products not registered in the order list',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the order in the database.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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

      const client = new MongoClient(server.getURI());

      await client.connect();

      const order = await client
        .db('tickets')
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
      const { statusCode } = await request(app.getHttpServer()).get('/orders');

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered order.', async () => {
      const { body } = await request(app.getHttpServer()).get('/orders');

      expect(body).toStrictEqual([]);
    });

    it('must return an array with one element when creating a order.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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
        .send(ordersPayload);

      const { body: getBody } = await request(app.getHttpServer()).get('/orders');

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
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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

      const { statusCode } = await request(app.getHttpServer()).get(`/orders/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct order when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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
        .send(ordersPayload);

      const { body: getBody } = await request(app.getHttpServer()).get(`/orders/${postBody.id}`);

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

    it(`should return status code 400 (Bad Request) when the order with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/orders/${new ObjectId()}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the order with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/orders/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'The order does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/orders/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/orders/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `The 'id' attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('DELETE -> /orders/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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

      const { statusCode } = await request(app.getHttpServer()).delete(`/orders/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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
        .send(ordersPayload);

      const { body: delBody } = await request(app.getHttpServer()).delete(`/orders/${postBody.id}`);

      expect(delBody).toStrictEqual({
        id: postBody.id,
        message: 'The order deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the order with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/orders/${new ObjectId()}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the order with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).delete(`/orders/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'The order does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/orders/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/orders/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `The 'id' attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the order from the database.', async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
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
        .send(ordersPayload);

      await request(app.getHttpServer()).delete(`/orders/${postBody.id}`);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const product = await client
        .db('tickets')
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