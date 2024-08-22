import { MongoMemoryServer } from 'mongodb-memory-server';

export class MongoInMemory {
  mongo: MongoMemoryServer;

  async start(): Promise<void> {
    this.mongo = await MongoMemoryServer.create();
  }

  getURI(): string {
    return this.mongo.getUri('tickets');
  }

  async stop(): Promise<void> {
    await this.mongo.stop();
  }
}
