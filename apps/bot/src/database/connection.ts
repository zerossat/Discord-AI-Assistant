import mongoose from 'mongoose';
import { childLogger } from '../utils/logger';

const log = childLogger('mongo');

let bound = false;

function bindEvents(): void {
  if (bound) return;
  bound = true;
  mongoose.connection.on('connected', () => log.info('connected'));
  mongoose.connection.on('error', (err) => log.error({ err }, 'connection error'));
  mongoose.connection.on('disconnected', () => log.warn('disconnected'));
}

/** Connect to MongoDB. Safe to call once during bootstrap. */
export async function connectMongo(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  bindEvents();
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: true,
  });
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

/** `true` when the connection is established (readyState === 1). */
export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
