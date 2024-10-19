import { MongoMemoryServer } from 'mongodb-memory-server';

import { name } from '../../package.json';

export class MongoInMemory {
  mongo: MongoMemoryServer;

  async start(): Promise<void> {
    this.mongo = await MongoMemoryServer.create();
  }

  getURI(): string {
    return this.mongo.getUri(name);
  }

  async stop(): Promise<void> {
    await this.mongo.stop();
  }
}
