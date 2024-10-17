import { Injectable } from '@nestjs/common';
import { createHash, randomUUID, UUID } from 'crypto';

@Injectable()
export class EncryptService {
  hashCompare(hash: string, valueToCompare: string): boolean {
    return hash === this.hashCreate(valueToCompare);
  }

  hashCreate(value: string): string {
    return createHash('sha256').update(value).update(process.env.HASH_SALT).digest('hex');
  }

  UUIDGenerate(): UUID {
    return randomUUID();
  }
}
