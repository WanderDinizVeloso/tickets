/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import { APP_GUARD } from '@nestjs/core';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';
import * as request from 'supertest';

import { AuthModule } from '../src/auth/auth.module';
import { EncryptModule } from '../src/encrypt/encrypt.module';
import { AuthGuard } from '../src/guards/auth.guard';
import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { MongoInMemory } from './utils/mongo-memory-server';

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
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

  const signUpPayload = { name: 'test', email: 'teste@teste.com', password: 'Teste123!' };

  const loginPayload = { email: signUpPayload.email, password: signUpPayload.password };

  const dateTest = new Date().toISOString();

  describe('POST -> /auth/sign-up', () => {
    it('should return status code 201 (Created) when the payload is correct.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      expect(statusCode).toBe(HttpStatus.CREATED);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      const { body } = await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      if (body?.id && typeof body.id === 'string') {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        id: 'idTest',
        message: `user created successfully.`,
        statusCode: 201,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is empty.`, async () => {
      const { statusCode } = await request(app.getHttpServer()).post('/auth/sign-up').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      const { body } = await request(app.getHttpServer()).post('/auth/sign-up').send({});

      expect(body).toStrictEqual({
        message: [
          'name must be a string',
          'name should not be empty',
          'email must be an email',
          'email should not be empty',
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password must be a string',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutName);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'name' attribute.`, async () => {
      const { name, ...payloadWithoutName } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutName);

      expect(body).toStrictEqual({
        message: ['name must be a string', 'name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'name' attribute is empty'.`, async () => {
      const { name, ...payloadWithoutName } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ name: '', ...payloadWithoutName });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'name' attribute is empty'.`, async () => {
      const { name, ...payloadWithoutName } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ name: '', ...payloadWithoutName });

      expect(body).toStrictEqual({
        message: ['name should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'email' attribute.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutEmail);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'email' attribute.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutEmail);

      expect(body).toStrictEqual({
        message: ['email must be an email', 'email should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute is empty'.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: '', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is empty'.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: '', ...payloadWithoutEmail });

      expect(body).toStrictEqual({
        message: ['email must be an email', 'email should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'email' attribute already exists'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      expect(body).toStrictEqual({
        message: 'email attribute(s) must be unique.',
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'password' attribute.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutPassword);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'password' attribute.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(payloadWithoutPassword);

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password must be a string',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute is empty'.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: '', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute is empty'.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: '', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 08 characters.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Teste1!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 08 characters.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Teste1', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'TESTE123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'TESTE123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'teste123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'teste123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 number.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testeee!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 number.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testeee!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testeeee', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testeeee', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the user in the database.', async () => {
      const { body } = await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const user = await client
        .db('tickets')
        .collection('users')
        .findOne(ObjectId.createFromHexString(body.id));

      await client.close();

      if (user?.createdAt) {
        user.createdAt = dateTest;
      }

      if (user?.updatedAt) {
        user.updatedAt = dateTest;
      }

      expect(user).toStrictEqual({
        _id: ObjectId.createFromHexString(body.id),
        name: signUpPayload.name,
        email: signUpPayload.email,
        password: createHash('sha256')
          .update(signUpPayload.password)
          .update(process.env.HASH_SALT)
          .digest('hex'),
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('POST -> /auth/login', () => {
    it('should return status code 200 (OK) when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer()).post('/auth/login').send(loginPayload);

      if (body?.accessToken && typeof body.accessToken === 'string') {
        body.accessToken = 'accessTokenTest';
      }

      if (body?.refreshToken && typeof body.refreshToken === 'string') {
        body.refreshToken = 'refreshTokenTest';
      }

      expect(body).toStrictEqual({
        accessToken: 'accessTokenTest',
        refreshToken: 'refreshTokenTest',
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is empty.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer()).post('/auth/login').send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer()).post('/auth/login').send({});

      expect(body).toStrictEqual({
        message: [
          'email must be an email',
          'email should not be empty',
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password must be a string',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 401 (Unauthorized) when the payload contains an email and password for an unregistered user.`, async () => {
      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the payload contains an email and password for an unregistered user.`, async () => {
      const { body } = await request(app.getHttpServer()).post('/auth/login').send(loginPayload);

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'wrong credentials',
        statusCode: 401,
      });
    });

    it(`should return status code 401 (Unauthorized) when the payload contains an incorrect user password.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Teste123!!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the payload contains an incorrect user password.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Teste123!!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'wrong credentials',
        statusCode: 401,
      });
    });

    it(`should return status code 401 (Unauthorized) when the payload contains an incorrect user email.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'teste2@teste.com', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the payload contains an incorrect user email.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'teste2@teste.com', ...payloadWithoutEmail });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'wrong credentials',
        statusCode: 401,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'email' attribute.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payloadWithoutEmail);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'email' attribute.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payloadWithoutEmail);

      expect(body).toStrictEqual({
        message: ['email must be an email', 'email should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute is empty'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is empty'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', ...payloadWithoutEmail });

      expect(body).toStrictEqual({
        message: ['email must be an email', 'email should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'password' attribute.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payloadWithoutPassword);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when payload does not have 'password' attribute.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payloadWithoutPassword);

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password must be a string',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute is empty'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: '', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute is empty'.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: '', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'password should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 08 characters.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Teste1!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 08 characters.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Teste1', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'TESTE123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'TESTE123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'teste123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'teste123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 number.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testeee!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 number.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testeee!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testeeee', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testeeee', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 8 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it('must correctly create the token in the database.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const refreshTokenBody = await client
        .db('tickets')
        .collection('refreshtokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const _idTest = new ObjectId();

      if (refreshTokenBody?.createdAt) {
        refreshTokenBody.createdAt = dateTest;
      }

      if (refreshTokenBody?.updatedAt) {
        refreshTokenBody.updatedAt = dateTest;
      }

      if (refreshTokenBody?.expiryDate) {
        refreshTokenBody.expiryDate = dateTest;
      }

      if (refreshTokenBody?._id) {
        refreshTokenBody._id = _idTest;
      }

      expect(refreshTokenBody).toStrictEqual({
        _id: _idTest,
        userId: signUpBody.id,
        token: loginBody.refreshToken,
        expiryDate: dateTest,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('POST -> /auth/refresh', () => {
    it('should return status code 200 (OK) when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      if (body?.accessToken && typeof body.accessToken === 'string') {
        body.accessToken = 'accessTokenTest';
      }

      if (body?.refreshToken && typeof body.refreshToken === 'string') {
        body.refreshToken = 'refreshTokenTest';
      }

      expect(body).toStrictEqual({
        accessToken: 'accessTokenTest',
        refreshToken: 'refreshTokenTest',
      });
    });

    it('should return status code 401 (Unauthorized) when the Bearer Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginBody.refreshToken });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Bearer Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: loginBody.refreshToken });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it('should return status code 401 (Unauthorized) when the Bearer Token is empty.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', '')
        .send({ refreshToken: loginBody.refreshToken });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Bearer Token is empty.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', '')
        .send({ refreshToken: loginBody.refreshToken });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it('should return status code 400 (Bad Request) when the Refresh Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Refresh Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({});

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['refreshToken must be a UUID', 'refreshToken should not be empty'],
        statusCode: 400,
      });
    });

    it('should return status code 400 (Bad Request) when the Refresh Token is empty.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Refresh Token is empty.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: '' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['refreshToken must be a UUID', 'refreshToken should not be empty'],
        statusCode: 400,
      });
    });

    it('should return status code 401 (Unauthorized) when the Refresh Token is invalid.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: randomUUID() });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Refresh Token is invalid.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: randomUUID() });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'refresh token is invalid',
        statusCode: 401,
      });
    });

    it('should return status code 401 (Unauthorized) when the Refresh Token has expired.', async () => {
      const dateExpired = new Date().setFullYear(Number('2001'));

      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      await client
        .db('tickets')
        .collection('refreshtokens')
        .findOneAndUpdate({ userId: signUpBody.id }, { $set: { expiryDate: dateExpired } });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Refresh Token has expired.', async () => {
      const dateExpired = new Date().setFullYear(Number('2001'));

      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      await client
        .db('tickets')
        .collection('refreshtokens')
        .findOneAndUpdate({ userId: signUpBody.id }, { $set: { expiryDate: dateExpired } });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'refresh token is invalid',
        statusCode: 401,
      });
    });

    it('must correctly update the token in the database.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body: refreshTokenBody } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      const client = new MongoClient(server.getURI());

      await client.connect();

      const refreshTokenResponse = await client
        .db('tickets')
        .collection('refreshtokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const _idTest = new ObjectId();

      if (refreshTokenResponse?.createdAt) {
        refreshTokenResponse.createdAt = dateTest;
      }

      if (refreshTokenResponse?.updatedAt) {
        refreshTokenResponse.updatedAt = dateTest;
      }

      if (refreshTokenResponse?.expiryDate) {
        refreshTokenResponse.expiryDate = dateTest;
      }

      if (refreshTokenResponse?._id) {
        refreshTokenResponse._id = _idTest;
      }

      expect(refreshTokenResponse).toStrictEqual({
        _id: _idTest,
        userId: signUpBody.id,
        token: refreshTokenBody.refreshToken,
        expiryDate: dateTest,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
