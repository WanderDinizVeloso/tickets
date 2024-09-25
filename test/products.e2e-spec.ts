/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import * as request from 'supertest';

import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { ProductsModule } from '../src/products/products.module';
import { MongoInMemory } from './utils/mongo-memory-server';

describe('Products (e2e)', () => {
  let app: INestApplication;

  const server = new MongoInMemory();

  beforeEach(async () => {
    await server.start();

    const uri = server.getURI();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), ProductsModule],
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

  const payload = { name: 'test', price: '1.65' };

  const dateTest = new Date().toISOString();

  describe('POST -> /products', () => {
    it('should return status code 201 (Created) when the payload is correct.', async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/products').send(payload);

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      if (body?.id && typeof body.id === 'string') {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        id: 'idTest',
        message: `product created successfully.`,
        statusCode: 201,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is empty.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/products').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send({});

      expect(body).toStrictEqual({
        message: [
          'name must be a string',
          'name should not be empty',
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
          'price should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/products')
        .send(payloadWithoutName);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/products')
        .send(payloadWithoutName);

      expect(body).toStrictEqual({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute is empty'.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/products')
        .send({ name: '', ...payloadWithoutName });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'name' attribute is empty'.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/products')
        .send({ name: '', ...payloadWithoutName });

      expect(body).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer()).post('/products').send(payload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/products').send(payload);

      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      expect(body).toStrictEqual({
        message: 'name attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'price' attribute.`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/products')
        .send(payloadWithoutPrice);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'price' attribute.`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/products')
        .send(payloadWithoutPrice);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
          'price should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'price' attribute is in the wrong format.`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { name: payload.name, price: 0 };

      const { statusCode } = await request(app.getHttpServer())
        .post('/products')
        .send(payloadPriceError);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = 0).`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: 0 };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = 1).`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: 1 };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = '0').`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: '0' };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = '1').`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: '1' };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = '1.0').`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: '1.0' };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = '1,00').`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: '1,00' };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when the 'price' attribute is in the wrong format (price = '1.000').`, async () => {
      const { price, ...payloadWithoutPrice } = payload;

      const payloadPriceError = { ...payloadWithoutPrice, price: '1.000' };

      const { body } = await request(app.getHttpServer()).post('/products').send(payloadPriceError);

      expect(body).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the product in the database.', async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const product = await client
        .db('tickets')
        .collection('products')
        .findOne(ObjectId.createFromHexString(body.id));

      await client.close();

      if (product?.createdAt) {
        product.createdAt = dateTest;
      }

      if (product?.updatedAt) {
        product.updatedAt = dateTest;
      }

      expect(product).toStrictEqual({
        _id: ObjectId.createFromHexString(body.id),
        name: payload.name,
        price: '1.650000000000000000000000000000000',
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('GET -> /products', () => {
    it('should return status code 200 (OK).', async () => {
      const { statusCode } = await request(app.getHttpServer()).get('/products');

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered product.', async () => {
      const { body } = await request(app.getHttpServer()).get('/products');

      expect(body).toStrictEqual([]);
    });

    it('must return an array with one element when creating a product.', async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: getBody } = await request(app.getHttpServer()).get('/products');

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          price: payload.price,
        },
      ]);
    });

    it(`should return an array with one element when adding only one productId in the 'id' query.`, async () => {
      const payload2 = { name: 'test2', price: '3.25' };

      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/products/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/products?id=${postBody.id}`,
      );

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          price: payload.price,
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than productId in the 'id' query.`, async () => {
      const payload2 = { name: 'test2', price: '3.25' };

      const payload3 = { name: 'test3', price: '4.55' };

      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(payload2);

      await request(app.getHttpServer()).post('/products').send(payload3);

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/products?id=${postBody.id},${postBody2.id}`,
      );

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          price: payload.price,
        },
        {
          id: postBody2.id,
          name: payload2.name,
          price: payload2.price,
        },
      ]);
    });

    it(`should return an array with one inactive element when adding 'false' to the 'active' query.`, async () => {
      const payload2 = { name: 'test2', price: '3.25' };

      await request(app.getHttpServer()).post('/products').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/products/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(`/products?active=false`);

      expect(getBody).toStrictEqual([
        {
          id: postBody2.id,
          name: payload2.name,
          price: payload2.price,
        },
      ]);
    });

    it(`should return an array with one active element when adding 'true' to the 'active' query.`, async () => {
      const payload2 = { name: 'test2', price: '3.25' };

      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/products')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/products/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(`/products`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          price: payload.price,
        },
      ]);
    });
  });

  describe('GET -> /products/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer()).get(`/products/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct product when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: getBody } = await request(app.getHttpServer()).get(`/products/${postBody.id}`);

      expect(getBody).toStrictEqual({
        id: postBody.id,
        name: payload.name,
        price: payload.price,
      });
    });

    it(`should return status code 400 (Bad Request) when the product with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/products/${new ObjectId()}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the product with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/products/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'product does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/products/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/products/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('PATCH -> /products/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute and patch payload are correct.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/${body.id}`)
        .send({ name: 'teste2' });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute and patch payload are correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ name: 'teste2' });

      expect(patchBody).toStrictEqual({
        id: postBody.id,
        message: 'product edited successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the product with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/${new ObjectId()}`)
        .send({ name: 'teste2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the product with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/${new ObjectId()}`)
        .send({ name: 'teste2' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'product does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/123`)
        .send({ name: 'teste2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/products/123`)
        .send({ name: 'teste2' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute already exists'.`, async () => {
      const secondPayload = { name: 'test2', price: '1.25' };

      const { body: firstPostBody } = await request(app.getHttpServer())
        .post('/products')
        .send(payload);

      await request(app.getHttpServer()).post('/products').send(secondPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/${firstPostBody.id}`)
        .send({ name: secondPayload.name });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      const secondPayload = { name: 'test2', price: '1.25' };

      const [{ body: firstPostBody }] = await Promise.all([
        await request(app.getHttpServer()).post('/products').send(payload),
        await request(app.getHttpServer()).post('/products').send(secondPayload),
      ]);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${firstPostBody.id}`)
        .send({ name: secondPayload.name });

      expect(patchBody).toStrictEqual({
        error: 'Bad Request',
        message: `name attribute(s) must be unique.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ name: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ name: '' });

      expect(patchBody).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when trying to update the 'price' attribute to an incorrect format.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: 0 });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = 0).`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: 0 });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = 1).`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: 1 });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = '0').`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: '0' });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = '1').`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: '1' });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = '1.0').`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: '1.0' });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = '1,00').`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: '1,00' });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return an error response when trying to update the 'price' attribute to an incorrect format (price = '1.000').`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/products/${postBody.id}`)
        .send({ price: '1.000' });

      expect(patchBody).toStrictEqual({
        message: [
          `price attribute is not a valid positive decimal number. It must be a string, positive and contain a 2 digit decimal separated by a period. ex.: '1.01'.`,
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly update the product in the database.', async () => {
      const patchPayload = { name: 'teste2', price: '9.99' };

      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      await request(app.getHttpServer()).patch(`/products/${postBody.id}`).send(patchPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const product = await client
        .db('tickets')
        .collection('products')
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
        name: patchPayload.name,
        price: '9.990000000000000000000000000000000',
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('DELETE -> /products/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/products').send(payload);

      const { statusCode } = await request(app.getHttpServer()).delete(`/products/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      const { body: delBody } = await request(app.getHttpServer()).delete(
        `/products/${postBody.id}`,
      );

      expect(delBody).toStrictEqual({
        id: postBody.id,
        message: 'product deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the product with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(
        `/products/${new ObjectId()}`,
      );

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the product with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).delete(`/products/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'product does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/products/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/products/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the product from the database.', async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/products').send(payload);

      await request(app.getHttpServer()).delete(`/products/${postBody.id}`);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const product = await client
        .db('tickets')
        .collection('products')
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
        name: payload.name,
        price: '1.650000000000000000000000000000000',
        active: false,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
