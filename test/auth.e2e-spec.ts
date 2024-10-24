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
import { AuthenticationGuard } from '../src/guards/authentication.guard';
import { InvalidIdInterceptor } from '../src/interceptors/invalid-id.interceptor';
import { UniqueAttributeInterceptor } from '../src/interceptors/unique-attribute.interceptor';
import { MailModule } from '../src/mail/mail.module';
import { name as DB_NAME } from '../package.json';
import { MongoInMemory } from './utils/mongo-memory-server';
import { envTest } from './utils/env-test.util';

const DATE_FULL_YEAR_EXPIRED = 2001;

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const originalEnv = process.env;

  const server = new MongoInMemory();

  beforeEach(async () => {
    process.env = envTest;

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
        MailModule,
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
  });

  afterEach(async () => {
    await server.stop();

    await app.close();

    process.env = originalEnv;
  });

  const signUpPayload = { name: 'test', email: 'test@test.com', password: 'Test123!' };

  const loginPayload = { email: signUpPayload.email, password: signUpPayload.password };

  const changePasswordPayload = {
    oldPassword: signUpPayload.password,
    newPassword: 'Test456!',
  };

  const forgotPasswordPayload = {
    email: signUpPayload.email,
  };

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
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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

    it(`should return status code 400 (Bad Request) when the 'name' attribute is empty.`, async () => {
      const { name, ...payloadWithoutName } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ name: '', ...payloadWithoutName });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'name' attribute is empty.`, async () => {
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

    it(`should return status code 400 (Bad Request) when the 'email' attribute is empty.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: '', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is empty.`, async () => {
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

    it(`should return status code 400 (Bad Request) when the 'email' attribute is not a valid email format.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: 'email', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is not a valid email format.`, async () => {
      const { email, ...payloadWithoutEmail } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ email: 'email', ...payloadWithoutEmail });

      expect(body).toStrictEqual({
        message: ['email must be an email'],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute already exists.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return an error response when the 'email' attribute already exists.`, async () => {
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
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'Test1!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 08 characters.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Test1', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'TEST123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'TEST123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'test123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'test123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 number.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testttt!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 number.`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testttt!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        error: 'Bad Request',
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testtttt', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { password, ...payloadWithoutPassword } = signUpPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({ password: 'Testtttt', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .db()
        .collection('users')
        .findOne({ _id: ObjectId.createFromHexString(body.id) });

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
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'Test123!!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the payload contains an incorrect user password.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Test123!!', ...payloadWithoutPassword });

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
        .send({ email: 'test2@test.com', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it(`should return error response when the payload contains an incorrect user email.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test2@test.com', ...payloadWithoutEmail });

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

    it(`should return status code 400 (Bad Request) when the 'email' attribute is not a valid email format.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test', ...payloadWithoutEmail });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is not a valid email format.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { email, ...payloadWithoutEmail } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test', ...payloadWithoutEmail });

      expect(body).toStrictEqual({
        message: ['email must be an email'],
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

    it(`should return error response when the payload is missing the 'password' attribute.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(payloadWithoutPassword);

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'Test1!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 08 characters.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Test1', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'TEST123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 lowercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'TEST123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'test123!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 uppercase letter.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'test123!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'Testttt!', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 number.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testttt!', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .send({ password: 'Testtttt', ...payloadWithoutPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'password' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { password, ...payloadWithoutPassword } = loginPayload;

      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'Testtttt', ...payloadWithoutPassword });

      expect(body).toStrictEqual({
        message: [
          'password must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
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
        .db(DB_NAME)
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
        refreshToken: loginBody.refreshToken,
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
        message: 'invalid Refresh Token',
        statusCode: 401,
      });
    });

    it('should return status code 400 (Bad Request) when the Refresh Token is not a valid UUID.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: 'test' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Refresh Token is not a valid UUID.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: 'test' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['refreshToken must be a UUID'],
        statusCode: 400,
      });
    });

    it('should return status code 401 (Unauthorized) when the Refresh Token has expired.', async () => {
      const dateExpired = new Date().setFullYear(DATE_FULL_YEAR_EXPIRED);

      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      await client
        .db(DB_NAME)
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
      const dateExpired = new Date().setFullYear(DATE_FULL_YEAR_EXPIRED);

      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      await client
        .db(DB_NAME)
        .collection('refreshtokens')
        .findOneAndUpdate({ userId: signUpBody.id }, { $set: { expiryDate: dateExpired } });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ refreshToken: loginBody.refreshToken });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Refresh Token',
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
        .db(DB_NAME)
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
        refreshToken: refreshTokenBody.refreshToken,
        expiryDate: dateTest,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('POST -> /auth/forgot-password', () => {
    it('should return status code 202 (ACCEPTED) when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordPayload);

      expect(statusCode).toBe(HttpStatus.ACCEPTED);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send(forgotPasswordPayload);

      expect(body).toStrictEqual({
        message: 'if the user exists, he will receive an email to reset his password.',
        statusCode: 202,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is empty.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is empty`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer()).post('/auth/forgot-password').send({});

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['email must be an email', 'email should not be empty'],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute is empty.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: '' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is empty.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: '' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['email must be an email', 'email should not be empty'],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'email' attribute is not a valid email format.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test' });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'email' attribute is not a valid email format.`, async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'test' });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['email must be an email'],
        statusCode: 400,
      });
    });

    it('must correctly create the reset token in the database.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const resetTokenBody = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const _idTest = new ObjectId();

      const resetTokenTest = 'resetTokenTest';

      if (resetTokenBody?.createdAt) {
        resetTokenBody.createdAt = dateTest;
      }

      if (resetTokenBody?.updatedAt) {
        resetTokenBody.updatedAt = dateTest;
      }

      if (resetTokenBody?.expiryDate) {
        resetTokenBody.expiryDate = dateTest;
      }

      if (resetTokenBody?._id) {
        resetTokenBody._id = _idTest;
      }

      if (resetTokenBody?.resetToken) {
        resetTokenBody.resetToken = resetTokenTest;
      }

      expect(resetTokenBody).toStrictEqual({
        _id: _idTest,
        userId: signUpBody.id,
        resetToken: resetTokenTest,
        expiryDate: dateTest,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('PATCH -> /auth/change-password', () => {
    it('should return status code 200 (OK) when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayload);

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayload);

      if (body.id) {
        body.id = 'idTest';
      }

      expect(body).toStrictEqual({
        id: 'idTest',
        message: 'user edited successfully.',
        statusCode: 200,
      });
    });

    it('should return status code 401 (Unauthorized) when the Bearer Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .send(changePasswordPayload);

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Bearer Token is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .send(changePasswordPayload);

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid Bearer Token',
        statusCode: 401,
      });
    });

    it('should return status code 400 (Bad Request) when the payload is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the payload is missing.', async () => {
      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({});

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword must be a string',
          'newPassword should not be empty',
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'oldPassword must be a string',
          'oldPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it('should return status code 400 (Bad Request) when the payload contains an incorrect user oldPassword.', async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Test890!', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the payload contains an incorrect user oldPassword.', async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Test890!', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'wrong credentials',
        statusCode: 401,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'oldPassword' attribute.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayloadWithoutOldPassword);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is missing the 'oldPassword' attribute.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayloadWithoutOldPassword);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'oldPassword must be a string',
          'oldPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute is empty.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: '', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute is empty.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: '', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'oldPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute does not contain at least 08 characters.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Test1', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute does not contain at least 08 characters.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Test1', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'TEST123!', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'TEST123!', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'test123!', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'test123!', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute does not contain at least 01 number.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Testttt!', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute does not contain at least 01 number.`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Testttt!', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'oldPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Testtttt', ...changePasswordPayloadWithoutOldPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'oldPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { oldPassword, ...changePasswordPayloadWithoutOldPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ oldPassword: 'Testtttt', ...changePasswordPayloadWithoutOldPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'oldPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'newPassword' attribute.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayloadWithoutNewPassword);

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is missing the 'newPassword' attribute.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayloadWithoutNewPassword);

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword must be a string',
          'newPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute is empty.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: '', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute is empty.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: '', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 08 characters.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Test1', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 08 characters.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Test1', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'TEST123!', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'TEST123!', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'test123!', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'test123!', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 number.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Testttt!', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 number.`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Testttt!', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Testtttt', ...changePasswordPayloadWithoutNewPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { newPassword, ...changePasswordPayloadWithoutNewPassword } = changePasswordPayload;

      await request(app.getHttpServer()).post('/auth/sign-up').send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      const { body } = await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send({ newPassword: 'Testtttt', ...changePasswordPayloadWithoutNewPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it('must correctly update the password in the database.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      const { body: loginBody } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginPayload);

      await request(app.getHttpServer())
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${loginBody.accessToken}`)
        .send(changePasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const user = await client
        .db(DB_NAME)
        .collection('users')
        .findOne({ _id: ObjectId.createFromHexString(signUpBody.id) });

      await client.close();

      if (user?.createdAt) {
        user.createdAt = dateTest;
      }

      if (user?.updatedAt) {
        user.updatedAt = dateTest;
      }

      expect(user).toStrictEqual({
        _id: ObjectId.createFromHexString(signUpBody.id),
        name: signUpPayload.name,
        email: signUpPayload.email,
        password: createHash('sha256')
          .update(changePasswordPayload.newPassword)
          .update(process.env.HASH_SALT)
          .digest('hex'),
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });

  describe('PATCH -> /auth/reset-password', () => {
    it('should return status code 200 (OK) when the payload is correct.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken, newPassword: changePasswordPayload.newPassword });

      expect(statusCode).toBe(HttpStatus.OK);
    });

    it('must correctly return all response attributes when the payload is correct.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken, newPassword: changePasswordPayload.newPassword });

      expect(body).toStrictEqual({
        message: 'user edited successfully.',
        statusCode: 200,
      });
    });

    it('should return status code 400 (Bad Request) when the payload is missing.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({});

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the payload is missing.', async () => {
      const { body } = await request(app.getHttpServer()).patch('/auth/reset-password').send({});

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'resetToken must be a UUID',
          'resetToken should not be empty',
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword must be a string',
          'newPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it('should return status code 400 (Bad Request) when the Reset Token is missing.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: changePasswordPayload.newPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Reset Token is missing.', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: changePasswordPayload.newPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['resetToken must be a UUID', 'resetToken should not be empty'],
        statusCode: 400,
      });
    });

    it('should return status code 400 (Bad Request) when the Reset Token is empty.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: '', newPassword: changePasswordPayload.newPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Reset Token is empty.', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: '', newPassword: changePasswordPayload.newPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['resetToken must be a UUID', 'resetToken should not be empty'],
        statusCode: 400,
      });
    });

    it('should return status code 401 (Unauthorized) when the Reset Token is invalid.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: randomUUID(), newPassword: changePasswordPayload.newPassword });

      expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return error response when the Reset Token is invalid.', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: randomUUID(), newPassword: changePasswordPayload.newPassword });

      expect(body).toStrictEqual({
        error: 'Unauthorized',
        message: 'invalid password reset link.',
        statusCode: 401,
      });
    });

    it('should return status code 400 (Bad Request) when the Reset Token is not a valid UUID.', async () => {
      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: 'test', newPassword: changePasswordPayload.newPassword });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return error response when the Reset Token is not a valid UUID.', async () => {
      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken: 'test', newPassword: changePasswordPayload.newPassword });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: ['resetToken must be a UUID'],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the payload is missing the 'newPassword' attribute.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the payload is missing the 'newPassword' attribute.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword must be a string',
          'newPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute is empty.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: '', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute is empty.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: '', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
          'newPassword should not be empty',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 08 characters.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Test1', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 08 characters.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Test1', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'TEST123!', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 lowercase letter.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'TEST123!', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'test123!', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 uppercase letter.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'test123!', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 number.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Testttt!', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 number.`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Testttt!', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it(`should return status code 400 (Bad Request) when the 'newPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { statusCode } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Testtttt', resetToken });

      expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    });

    it(`should return error response when the 'newPassword' attribute does not contain at least 01 of the following special characters: #?!@$%^&*-`, async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await client.close();

      const { body } = await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ newPassword: 'Testtttt', resetToken });

      expect(body).toStrictEqual({
        error: 'Bad Request',
        message: [
          'newPassword must contain at least 08 (eight) characters, 01 (one) capital letter, 01 (one) lowercase letter, 01 (one) number and 01 (one) of the following special characters: #?!@$%^&*-',
        ],
        statusCode: 400,
      });
    });

    it('must correctly update the password in the database.', async () => {
      const { body: signUpBody } = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send(signUpPayload);

      await request(app.getHttpServer()).post('/auth/forgot-password').send(forgotPasswordPayload);

      const client = new MongoClient(server.getURI());

      await client.connect();

      const { resetToken } = await client
        .db(DB_NAME)
        .collection('resettokens')
        .findOne({ userId: signUpBody.id });

      await request(app.getHttpServer())
        .patch('/auth/reset-password')
        .send({ resetToken, newPassword: changePasswordPayload.newPassword });

      const user = await client
        .db(DB_NAME)
        .collection('users')
        .findOne({ _id: ObjectId.createFromHexString(signUpBody.id) });

      await client.close();

      if (user?.createdAt) {
        user.createdAt = dateTest;
      }

      if (user?.updatedAt) {
        user.updatedAt = dateTest;
      }

      expect(user).toStrictEqual({
        _id: ObjectId.createFromHexString(signUpBody.id),
        name: signUpPayload.name,
        email: signUpPayload.email,
        password: createHash('sha256')
          .update(changePasswordPayload.newPassword)
          .update(process.env.HASH_SALT)
          .digest('hex'),
        active: true,
        createdAt: dateTest,
        updatedAt: dateTest,
      });
    });
  });
});
