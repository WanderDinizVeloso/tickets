import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import * as request from 'supertest';

import { CardsModule } from '../src/cards/cards.module';
import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { MongoInMemory } from './utils/mongo-memory-server';

const FIRST_ELEMENT = 0;
const IDS_LENGTH = 7;
const SECOND_ELEMENT = 1;

describe('Cards (e2e)', () => {
  let app: INestApplication;

  const dateTest = new Date().toISOString();

  const server = new MongoInMemory();

  const productPayload1 = { name: 'test', price: '1.65' };

  const productPayload2 = { name: 'test2', price: '2.36' };

  const idTest = new ObjectId().toString();

  beforeEach(async () => {
    await server.start();

    const uri = server.getURI();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), CardsModule],
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

  describe('POST -> /cards', () => {
    it('should return status code 201 (Created) when the cardsPayload is correct.', async () => {
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
            quantity: '2.300',
          },
          {
            id: productBody2.id,
            quantity: '3.200',
          },
        ],
      };

      const { body: orderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: orderBody.id });

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the cardsPayload is correct.', async () => {
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
            quantity: '2.300',
          },
          {
            id: productBody2.id,
            quantity: '3.200',
          },
        ],
      };

      const { body: orderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: orderBody.id });

      const idsMock = ['idTest1', 'idTest2', 'idTest3', 'idTest4', 'idTest5', 'idTest6', 'idTest7'];

      if (body?.ids && Array.isArray(body.ids) && body.ids.length === IDS_LENGTH) {
        body.ids = idsMock;
      }

      expect(body).toStrictEqual({
        ids: idsMock,
        message: `The cards were created successfully.`,
        statusCode: 201,
      });
    });

    it(`should return status code 400 (Bad Request) when the cardsPayload is missing all attributes.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/cards').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the cardsPayload is missing all attributes.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/cards').send({});

      expect(body).toStrictEqual({
        message: ['orderId must be a mongodb id', 'orderId should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the cardsPayload is missing the 'orderId' attribute.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/cards').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response  when the cardsPayload is missing the 'orderId' attribute.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/cards').send({});

      expect(body).toStrictEqual({
        message: ['orderId must be a mongodb id', 'orderId should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'orderId' in the cardsPayload is empty.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response  when the 'orderId' in the cardsPayload is empty.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/cards').send({ orderId: '' });

      expect(body).toStrictEqual({
        message: ['orderId must be a mongodb id', 'orderId should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'orderId' in the cardsPayload is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: '123' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response  when the 'orderId' in the cardsPayload is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/cards').send({ orderId: '123' });

      expect(body).toStrictEqual({
        message: ['orderId must be a mongodb id'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'order' of 'orderId' does not exist in the database.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: idTest });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response  when the 'order' of 'orderId' does not exist in the database.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/cards').send({ orderId: idTest });

      expect(body).toStrictEqual({
        message: 'The order does not exist.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when cards for the 'orderId' have already been created.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '2.300',
          },
        ],
      };

      const { body: orderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      await request(app.getHttpServer()).post('/cards').send({ orderId: orderBody.id });

      const { statusCode } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: orderBody.id });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response  when cards for the 'orderId' have already been created.`, async () => {
      const { body: productBody1 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody1.id,
            quantity: '2.300',
          },
        ],
      };

      const { body: orderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      await request(app.getHttpServer()).post('/cards').send({ orderId: orderBody.id });

      const { body } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: orderBody.id });

      expect(body).toStrictEqual({
        message: 'Cards have already been created for the specified orderId.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the cards in the database.', async () => {
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
            quantity: '2.300',
          },
          {
            id: productBody2.id,
            quantity: '3.200',
          },
        ],
      };

      const { body: orderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: gerOrderBody } = await request(app.getHttpServer()).get(
        `/orders/${orderBody.id}`,
      );

      await request(app.getHttpServer()).post('/cards').send({ orderId: orderBody.id });

      const client = new MongoClient(server.getURI());

      await client.connect();

      const cards = await client.db('tickets').collection('cards').find({}).toArray();

      await client.close();

      const cardsMock = cards.map((card) => ({
        ...card,
        _id: card._id ? idTest : card._id,
        createdAt: card.createdAt ? dateTest : card.createdAt,
        updatedAt: card.updatedAt ? dateTest : card.updatedAt,
      }));

      expect(cardsMock).toStrictEqual([
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[FIRST_ELEMENT].name,
          orderId: gerOrderBody.id,
          price: '1.650000000000000000000000000000000',
          productId: gerOrderBody.products[FIRST_ELEMENT].id,
          quantity: '1.000000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[FIRST_ELEMENT].name,
          orderId: gerOrderBody.id,
          price: '1.650000000000000000000000000000000',
          productId: gerOrderBody.products[FIRST_ELEMENT].id,
          quantity: '1.000000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[FIRST_ELEMENT].name,
          orderId: gerOrderBody.id,
          price: '0.495000000000000000000000000000000',
          productId: gerOrderBody.products[FIRST_ELEMENT].id,
          quantity: '0.300000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[SECOND_ELEMENT].name,
          orderId: orderBody.id,
          price: '2.360000000000000000000000000000000',
          productId: gerOrderBody.products[SECOND_ELEMENT].id,
          quantity: '1.000000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[SECOND_ELEMENT].name,
          orderId: orderBody.id,
          price: '2.360000000000000000000000000000000',
          productId: gerOrderBody.products[SECOND_ELEMENT].id,
          quantity: '1.000000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[SECOND_ELEMENT].name,
          orderId: orderBody.id,
          price: '2.360000000000000000000000000000000',
          productId: gerOrderBody.products[SECOND_ELEMENT].id,
          quantity: '1.000000000000000000000000000000000',
          updatedAt: dateTest,
        },
        {
          _id: idTest,
          active: true,
          createdAt: dateTest,
          name: gerOrderBody.products[SECOND_ELEMENT].name,
          orderId: orderBody.id,
          price: '0.472000000000000000000000000000000',
          productId: gerOrderBody.products[SECOND_ELEMENT].id,
          quantity: '0.200000000000000000000000000000000',
          updatedAt: dateTest,
        },
      ]);
    });
  });

  describe('GET -> /cards', () => {
    it('should return status code 200 (OK).', async () => {
      const { statusCode } = await request(app.getHttpServer()).get('/cards');

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered order.', async () => {
      const { body } = await request(app.getHttpServer()).get('/cards');

      expect(body).toStrictEqual([]);
    });

    it('must return an array with one element when creating a card.', async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody.id });

      const { body } = await request(app.getHttpServer()).get('/cards');

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`must return an array with more than one element when adding one cardId in the 'id' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      const { body: postCards1 } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody2.id });

      const { body } = await request(app.getHttpServer()).get(
        `/cards?id=${postCards1.ids[FIRST_ELEMENT]}`,
      );

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than cardId in the 'id' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const productPayload3 = { name: 'test3', price: '4.55' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const { body: productBody3 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload3);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload3 = {
        products: [
          {
            id: productBody3.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      const { body: postOrderBody3 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload3);

      const { body: postCards1 } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { body: postCards2 } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody2.id });

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody3.id });

      const { body } = await request(app.getHttpServer()).get(
        `/cards?id=${postCards1.ids[FIRST_ELEMENT]},${postCards2.ids[FIRST_ELEMENT]}`,
      );

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      if (body[SECOND_ELEMENT].id) {
        body[SECOND_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
        {
          id: idTest,
          name: productPayload2.name,
          price: productPayload2.price,
          quantity: ordersPayload2.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`should return an array with one inactive element when adding 'false' to the 'active' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody.id });

      const { body: postCards2 } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody2.id });

      await request(app.getHttpServer()).delete(`/cards/${postCards2.ids[FIRST_ELEMENT]}`);

      const { body } = await request(app.getHttpServer()).get(`/cards?active=false`);

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload2.name,
          price: productPayload2.price,
          quantity: ordersPayload2.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`should return an array with one inactive element when adding 'true' to the 'active' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody.id });

      const { body: postCards2 } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody2.id });

      await request(app.getHttpServer()).delete(`/cards/${postCards2.ids[FIRST_ELEMENT]}`);

      const { body } = await request(app.getHttpServer()).get(`/cards?active=true`);

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`must return an array with more than one element when adding one cardId in the 'orderId' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody.id });

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody2.id });

      const { body } = await request(app.getHttpServer()).get(`/cards?orderId=${postOrderBody.id}`);

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than cardId in the 'id' query.`, async () => {
      const productPayload2 = { name: 'test2', price: '3.25' };

      const productPayload3 = { name: 'test3', price: '4.55' };

      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const { body: productBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload2);

      const { body: productBody3 } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload3);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload2 = {
        products: [
          {
            id: productBody2.id,
            quantity: '1.000',
          },
        ],
      };

      const ordersPayload3 = {
        products: [
          {
            id: productBody3.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postOrderBody2 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload2);

      const { body: postOrderBody3 } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload3);

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody.id });

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody2.id });

      await request(app.getHttpServer()).post('/cards').send({ orderId: postOrderBody3.id });

      const { body } = await request(app.getHttpServer()).get(
        `/cards?orderId=${postOrderBody.id},${postOrderBody2.id}`,
      );

      if (body[FIRST_ELEMENT].id) {
        body[FIRST_ELEMENT].id = idTest;
      }

      if (body[SECOND_ELEMENT].id) {
        body[SECOND_ELEMENT].id = idTest;
      }

      expect(body).toStrictEqual([
        {
          id: idTest,
          name: productPayload1.name,
          price: productPayload1.price,
          quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
        },
        {
          id: idTest,
          name: productPayload2.name,
          price: productPayload2.price,
          quantity: ordersPayload2.products[FIRST_ELEMENT].quantity,
        },
      ]);
    });
  });

  describe('GET -> /cards/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postCardBody } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { body } = await request(app.getHttpServer()).get(
        `/cards/${postCardBody.ids[FIRST_ELEMENT]}`,
      );

      const { statusCode } = await request(app.getHttpServer()).get(`/cards/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct card when the 'id' attribute is correct.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postCardBody } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { body: getCardBody } = await request(app.getHttpServer()).get(
        `/cards/${postCardBody.ids[FIRST_ELEMENT]}`,
      );

      const { body } = await request(app.getHttpServer()).get(`/cards/${getCardBody.id}`);

      if (body.id) {
        body.id = idTest;
      }

      expect(body).toStrictEqual({
        id: idTest,
        name: productPayload1.name,
        price: productPayload1.price,
        quantity: ordersPayload.products[FIRST_ELEMENT].quantity,
      });
    });

    it(`should return status code 400 (Bad Request) when the card with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/cards/${idTest}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the order with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/cards/${idTest}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'The card does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/cards/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/cards/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `The 'id' attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('DELETE -> /cards/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postCardBody } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { statusCode } = await request(app.getHttpServer()).delete(
        `/cards/${postCardBody.ids[FIRST_ELEMENT]}`,
      );

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postCardBody } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { body: delBody } = await request(app.getHttpServer()).delete(
        `/cards/${postCardBody.ids[FIRST_ELEMENT]}`,
      );

      expect(delBody).toStrictEqual({
        id: postCardBody.ids[FIRST_ELEMENT],
        message: 'The card deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the card with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/cards/${idTest}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the card with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).delete(`/cards/${idTest}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'The card does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/cards/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/cards/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `The 'id' attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the card from the database.', async () => {
      const { body: productBody } = await request(app.getHttpServer())
        .post('/products')
        .send(productPayload1);

      const ordersPayload = {
        products: [
          {
            id: productBody.id,
            quantity: '1.000',
          },
        ],
      };

      const { body: postOrderBody } = await request(app.getHttpServer())
        .post('/orders')
        .send(ordersPayload);

      const { body: postCardBody } = await request(app.getHttpServer())
        .post('/cards')
        .send({ orderId: postOrderBody.id });

      const { body: delBody } = await request(app.getHttpServer()).delete(
        `/cards/${postCardBody.ids[FIRST_ELEMENT]}`,
      );

      const client = new MongoClient(server.getURI());

      await client.connect();

      const card = await client
        .db('tickets')
        .collection('cards')
        .findOne(ObjectId.createFromHexString(delBody.id));

      await client.close();

      if (card?.createdAt) {
        card.createdAt = dateTest;
      }

      if (card?.updatedAt) {
        card.updatedAt = dateTest;
      }

      expect(card).toStrictEqual({
        _id: ObjectId.createFromHexString(delBody.id),
        name: productPayload1.name,
        orderId: postOrderBody.id,
        price: '1.650000000000000000000000000000000',
        productId: productBody.id,
        quantity: '1.000000000000000000000000000000000',
        active: false,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
