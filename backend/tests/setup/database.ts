import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

let testDbClient: Client;
const TEST_DB_NAME = `test_guest_mgmt_${Date.now()}`;

export async function setupTestDatabase(): Promise<void> {
  // Create test database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to default database first
  });

  try {
    await adminClient.connect();
    await adminClient.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  } catch (error) {
    console.warn('Test database creation failed, using existing database');
  } finally {
    await adminClient.end();
  }

  // Connect to test database
  testDbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: TEST_DB_NAME,
  });

  await testDbClient.connect();

  // Run database schema
  const schemaPath = path.join(__dirname, '../../init_db.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await testDbClient.query(schema);
  }

  // Set test database URL for services
  process.env.DATABASE_URL = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${TEST_DB_NAME}`;
}

export async function teardownTestDatabase(): Promise<void> {
  if (testDbClient) {
    await testDbClient.end();
  }

  // Drop test database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    await adminClient.query(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}"`);
  } catch (error) {
    console.warn('Test database cleanup failed:', error);
  } finally {
    await adminClient.end();
  }
}

export async function clearTestData(): Promise<void> {
  if (!testDbClient) return;

  // Clear data in dependency order
  const tables = [
    'table_assignments',
    'seating_constraints', 
    'tables',
    'versions',
    'guests',
    'groups',
    'event_collaborators',
    'events',
    'users'
  ];

  for (const table of tables) {
    await testDbClient.query(`DELETE FROM ${table}`);
  }
}

export function getTestDbClient(): Client {
  return testDbClient;
}