/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import * as request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { EncryptModule } from '../src/encrypt/encrypt.module';
import { AuthenticationGuard } from '../src/guards/authentication.guard';
import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { TenantsModule } from '../src/tenants/tenants.module';
import { MongoInMemory } from './utils/mongo-memory-server';

describe('Tenants (e2e)', () => {
  let app: INestApplication;

  let token: string;

  const server = new MongoInMemory();

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
        TenantsModule,
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

    token = '';
  });

  const payload = { name: 'nameTest', document: 'documentTest' };

  const dateTest = new Date().toISOString();

  describe('POST -> /tenants', () => {
    it('should return status code 201 (Created) when the payload is correct.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      if (body?.id && typeof body.id === 'string') {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        id: 'idTest',
        message: `tenant created successfully.`,
        statusCode: 201,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is empty.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(body).toStrictEqual({
        message: [
          'name must be a string',
          'name should not be empty',
          'document must be a string',
          'document should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithoutName);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
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
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', ...payloadWithoutName });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'name' attribute is empty'.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', ...payloadWithoutName });

      expect(body).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute already exists'.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...payloadWithoutDocument, document: 'testDocument2' });

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...payloadWithoutDocument, document: 'testDocument2' });

      expect(body).toStrictEqual({
        message: 'name attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'document' attribute.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithoutDocument);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'document' attribute.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payloadWithoutDocument);

      expect(body).toStrictEqual({
        message: ['document must be a string', 'document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'document' attribute is empty'.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ document: '', ...payloadWithoutDocument });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'document' attribute is empty'.`, async () => {
      const { document, ...payloadWithoutDocument } = payload;

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ document: '', ...payloadWithoutDocument });

      expect(body).toStrictEqual({
        message: ['document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'document' attribute already exists'.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'testName2', ...payloadWithoutName });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'document' attribute already exists'.`, async () => {
      const { name, ...payloadWithoutName } = payload;

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'testName2', ...payloadWithoutName });

      expect(body).toStrictEqual({
        message: 'document attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the tenant in the database.', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const tenant = await client
        .db('tickets')
        .collection('tenants')
        .findOne(ObjectId.createFromHexString(body.id));

      await client.close();

      if (tenant?.createdAt) {
        tenant.createdAt = dateTest;
      }

      if (tenant?.updatedAt) {
        tenant.updatedAt = dateTest;
      }

      expect(tenant).toStrictEqual({
        _id: ObjectId.createFromHexString(body.id),
        name: payload.name,
        document: payload.document,
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('GET -> /tenants', () => {
    it('should return status code 200 (OK).', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered tenant.', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual([]);
    });

    it('must return an array with one element when creating a tenant.', async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: getBody } = await request(app.getHttpServer())
        .get('/tenants')
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
      ]);
    });

    it(`should return an array with one element when adding only one tenantId in the 'id' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .delete(`/tenants/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants?id=${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than tenantId in the 'id' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      const payload3 = { name: 'nameTest3', document: 'documentTest3' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload3);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants?id=${postBody.id},${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
        {
          id: postBody2.id,
          name: payload2.name,
          document: payload2.document,
        },
      ]);
    });

    it(`should return an array with one element when adding only one tenantId in the 'document' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .delete(`/tenants/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getTenant } = await request(app.getHttpServer())
        .get(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants?document=${getTenant.document}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
      ]);
    });

    it(`must return an array with more than one element when adding more than tenantId in the 'document' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      const payload3 = { name: 'nameTest3', document: 'documentTest3' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload3);

      const { body: getTenant } = await request(app.getHttpServer())
        .get(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getTenant2 } = await request(app.getHttpServer())
        .get(`/tenants/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants?document=${getTenant.document},${getTenant2.document}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
        {
          id: postBody2.id,
          name: payload2.name,
          document: payload2.document,
        },
      ]);
    });

    it(`should return an array with one inactive element when adding 'false' to the 'active' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .delete(`/tenants/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants?active=false`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody2.id,
          name: payload2.name,
          document: payload2.document,
        },
      ]);
    });

    it(`should return an array with one active element when adding 'true' to the 'active' query.`, async () => {
      const payload2 = { name: 'nameTest2', document: 'documentTest2' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload2);

      await request(app.getHttpServer())
        .delete(`/tenants/${postBody2.id}`)
        .set('Authorization', `Bearer ${token}`);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual([
        {
          id: postBody.id,
          name: payload.name,
          document: payload.document,
        },
      ]);
    });
  });

  describe('GET -> /tenants/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .get(`/tenants/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct tenant when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: getBody } = await request(app.getHttpServer())
        .get(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getBody).toStrictEqual({
        id: postBody.id,
        name: payload.name,
        document: payload.document,
      });
    });

    it(`should return status code 400 (Bad Request) when the tenant with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'tenant does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .get(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('PATCH -> /tenants/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute and patch payload are correct.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute and patch payload are correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(patchBody).toStrictEqual({
        id: postBody.id,
        message: 'tenant edited successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the tenant with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'tenant does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'nameTest2' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const { body: firstPostBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(secondPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: secondPayload.name });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const [{ body: firstPostBody }] = await Promise.all([
        await request(app.getHttpServer())
          .post('/tenants')
          .set('Authorization', `Bearer ${token}`)
          .send(payload),
        await request(app.getHttpServer())
          .post('/tenants')
          .set('Authorization', `Bearer ${token}`)
          .send(secondPayload),
      ]);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: secondPayload.name });

      expect(patchBody).toStrictEqual({
        error: 'Bad Request',
        message: `name attribute(s) must be unique.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(patchBody).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'document' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const { body: firstPostBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(secondPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ document: secondPayload.document });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'document' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const [{ body: firstPostBody }] = await Promise.all([
        await request(app.getHttpServer())
          .post('/tenants')
          .set('Authorization', `Bearer ${token}`)
          .send(payload),
        await request(app.getHttpServer())
          .post('/tenants')
          .set('Authorization', `Bearer ${token}`)
          .send(secondPayload),
      ]);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ document: secondPayload.document });

      expect(patchBody).toStrictEqual({
        error: 'Bad Request',
        message: `document attribute(s) must be unique.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) trying to update the 'document' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ document: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response trying to update the 'document' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ document: '' });

      expect(patchBody).toStrictEqual({
        message: ['document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly update the tenant in the database.', async () => {
      const patchPayload = { name: 'nameTest2', document: 'documentTest2' };

      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const tenant = await client
        .db('tickets')
        .collection('tenants')
        .findOne(ObjectId.createFromHexString(postBody.id));

      await client.close();

      if (tenant?.createdAt) {
        tenant.createdAt = dateTest;
      }

      if (tenant?.updatedAt) {
        tenant.updatedAt = dateTest;
      }

      expect(tenant).toStrictEqual({
        _id: ObjectId.createFromHexString(postBody.id),
        name: patchPayload.name,
        document: patchPayload.document,
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('DELETE -> /tenants/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute is correct.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .delete(`/tenants/${body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      const { body: delBody } = await request(app.getHttpServer())
        .delete(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delBody).toStrictEqual({
        id: postBody.id,
        message: 'tenant deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the tenant with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .delete(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .delete(`/tenants/${new ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'tenant does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .delete(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/tenants/123`)
        .set('Authorization', `Bearer ${token}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the tenant from the database.', async () => {
      const { body: postBody } = await request(app.getHttpServer())
        .post('/tenants')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      await request(app.getHttpServer())
        .delete(`/tenants/${postBody.id}`)
        .set('Authorization', `Bearer ${token}`);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const tenant = await client
        .db('tickets')
        .collection('tenants')
        .findOne(ObjectId.createFromHexString(postBody.id));

      await client.close();

      if (tenant?.createdAt) {
        tenant.createdAt = dateTest;
      }

      if (tenant?.updatedAt) {
        tenant.updatedAt = dateTest;
      }

      expect(tenant).toStrictEqual({
        _id: ObjectId.createFromHexString(postBody.id),
        name: payload.name,
        document: payload.document,
        active: false,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
