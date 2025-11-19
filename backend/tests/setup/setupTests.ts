import { setupTestDatabase, teardownTestDatabase } from './database';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});