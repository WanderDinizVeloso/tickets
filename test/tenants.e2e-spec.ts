import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoClient, ObjectId } from 'mongodb';
import * as request from 'supertest';

import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { TenantsModule } from '../src/tenants/tenants.module';
import { MongoInMemory } from './utils/mongo-memory-server';

describe('Tenants (e2e)', () => {
  let app: INestApplication;

  const server = new MongoInMemory();

  beforeEach(async () => {
    await server.start();

    const uri = server.getURI();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(uri), TenantsModule],
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

  const payload = { name: 'nameTest', document: 'documentTest' };

  const dateTest = new Date().toISOString();

  describe('POST -> /tenants', () => {
    it('should return status code 201 (Created) when the payload is correct.', async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/tenants').send(payload);

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      const { body } = await request(app.getHttpServer()).post('/tenants').send(payload);

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
      const { statusCode } = await request(app.getHttpServer()).post('/tenants').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      const { body } = await request(app.getHttpServer()).post('/tenants').send({});

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
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ document: payload.document });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'name' attribute.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ document: payload.document });

      expect(body).toStrictEqual({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute is empty'.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: '', document: payload.document });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'name' attribute is empty'.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: '', document: payload.document });

      expect(body).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer()).post('/tenants').send(payload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: payload.name, document: 'testDocument2' });

      expect(body).toStrictEqual({
        message: 'name attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'document' attribute.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: payload.name });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'document' attribute.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: payload.name });

      expect(body).toStrictEqual({
        message: ['document must be a string', 'document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'document' attribute is empty'.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ document: '', name: payload.name });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'document' attribute is empty'.`, async () => {
      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ document: '', name: payload.name });

      expect(body).toStrictEqual({
        message: ['document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'document' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'testName2', document: payload.document });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'document' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body } = await request(app.getHttpServer())
        .post('/tenants')
        .send({ name: 'testName2', document: payload.document });

      expect(body).toStrictEqual({
        message: 'document attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the tenant in the database.', async () => {
      const { body } = await request(app.getHttpServer()).post('/tenants').send(payload);

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
      const { statusCode } = await request(app.getHttpServer()).get('/tenants');

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must return an empty array when there is no registered tenant.', async () => {
      const { body } = await request(app.getHttpServer()).get('/tenants');

      expect(body).toStrictEqual([]);
    });

    it('must return an array with one element when creating a tenant.', async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: getBody } = await request(app.getHttpServer()).get('/tenants');

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

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/tenants/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/tenants?id=${postBody.id}`,
      );

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

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).post('/tenants').send(payload3);

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/tenants?id=${postBody.id},${postBody2.id}`,
      );

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

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/tenants/${postBody2.id}`);

      const { body: getTenant } = await request(app.getHttpServer()).get(`/tenants/${postBody.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/tenants?document=${getTenant.document}`,
      );

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

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).post('/tenants').send(payload3);

      const { body: getTenant } = await request(app.getHttpServer()).get(`/tenants/${postBody.id}`);

      const { body: getTenant2 } = await request(app.getHttpServer()).get(
        `/tenants/${postBody2.id}`,
      );

      const { body: getBody } = await request(app.getHttpServer()).get(
        `/tenants?document=${getTenant.document},${getTenant2.document}`,
      );

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

      await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/tenants/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(`/tenants?active=false`);

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

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: postBody2 } = await request(app.getHttpServer())
        .post('/tenants')
        .send(payload2);

      await request(app.getHttpServer()).delete(`/tenants/${postBody2.id}`);

      const { body: getBody } = await request(app.getHttpServer()).get(`/tenants`);

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
      const { body } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer()).get(`/tenants/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`should return the correct tenant when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: getBody } = await request(app.getHttpServer()).get(`/tenants/${postBody.id}`);

      expect(getBody).toStrictEqual({
        id: postBody.id,
        name: payload.name,
        document: payload.document,
      });
    });

    it(`should return status code 400 (Bad Request) when the tenant with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/tenants/${new ObjectId()}`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/tenants/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'tenant does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).get(`/tenants/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/tenants/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });
  });

  describe('PATCH -> /tenants/:id', () => {
    it(`should return status code 200 (OK) when the 'id' attribute and patch payload are correct.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${body.id}`)
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute and patch payload are correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
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
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/tenants/${new ObjectId()}`)
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
        .send({ name: 'nameTest2' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/tenants/123`)
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
        .send(payload);

      await request(app.getHttpServer()).post('/tenants').send(secondPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .send({ name: secondPayload.name });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'name' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const [{ body: firstPostBody }] = await Promise.all([
        await request(app.getHttpServer()).post('/tenants').send(payload),
        await request(app.getHttpServer()).post('/tenants').send(secondPayload),
      ]);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .send({ name: secondPayload.name });

      expect(patchBody).toStrictEqual({
        error: 'Bad Request',
        message: `name attribute(s) must be unique.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .send({ name: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response trying to update the 'name' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
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
        .send(payload);

      await request(app.getHttpServer()).post('/tenants').send(secondPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .send({ document: secondPayload.document });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'document' attribute already exists'.`, async () => {
      const secondPayload = { name: 'nameTest2', document: 'documentTest2' };

      const [{ body: firstPostBody }] = await Promise.all([
        await request(app.getHttpServer()).post('/tenants').send(payload),
        await request(app.getHttpServer()).post('/tenants').send(secondPayload),
      ]);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${firstPostBody.id}`)
        .send({ document: secondPayload.document });

      expect(patchBody).toStrictEqual({
        error: 'Bad Request',
        message: `document attribute(s) must be unique.`,
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) trying to update the 'document' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .send({ document: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response trying to update the 'document' attribute to an empty'.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: patchBody } = await request(app.getHttpServer())
        .patch(`/tenants/${postBody.id}`)
        .send({ document: '' });

      expect(patchBody).toStrictEqual({
        message: ['document should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly update the tenant in the database.', async () => {
      const patchPayload = { name: 'nameTest2', document: 'documentTest2' };

      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      await request(app.getHttpServer()).patch(`/tenants/${postBody.id}`).send(patchPayload);

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
      const { body } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { statusCode } = await request(app.getHttpServer()).delete(`/tenants/${body.id}`);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it(`must correctly return all response attributes when the 'id' attribute is correct.`, async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      const { body: delBody } = await request(app.getHttpServer()).delete(
        `/tenants/${postBody.id}`,
      );

      expect(delBody).toStrictEqual({
        id: postBody.id,
        message: 'tenant deleted successfully.',
        statusCode: 200,
      });
    });

    it(`should return status code 400 (Bad Request) when the tenant with random 'id' does not exist.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(
        `/tenants/${new ObjectId()}`,
      );

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the tenant with random 'id' does not exist.`, async () => {
      const { body } = await request(app.getHttpServer()).delete(`/tenants/${new ObjectId()}`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: 'tenant does not exist.',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'id' is not a valid ObjectId.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).delete(`/tenants/123`);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'id' is not a valid ObjectId.`, async () => {
      const { body } = await request(app.getHttpServer()).get(`/tenants/123`);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: `id attribute is invalid.`,
        statusCode: 400,
      });
    });

    it('must correctly delete the tenant from the database.', async () => {
      const { body: postBody } = await request(app.getHttpServer()).post('/tenants').send(payload);

      await request(app.getHttpServer()).delete(`/tenants/${postBody.id}`);

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
