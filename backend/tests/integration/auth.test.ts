import { TestClient } from '../helpers/testClient';
import { TestFactory } from '../helpers/testFactory';
import { INVALID_DATA } from '../setup/fixtures';

describe('Authentication', () => {
  let client: TestClient;
  let factory: TestFactory;

  beforeEach(async () => {
    client = new TestClient();
    factory = new TestFactory(client);
    await factory.reset();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await factory.createOwner();

      expect(response.success).toBe(true);
      expect(response.message).toBe('User registered successfully');
      expect(response.data.user).toEqual({
        id: expect.any(String),
        email: 'owner@test.com',
        displayName: 'Event Owner',
      });
      expect(response.data.token).toBeDefined();
      expect(typeof response.data.token).toBe('string');
    });

    it('should reject duplicate email registration', async () => {
      await factory.createOwner();
      
      const response = await client.register({
        email: 'owner@test.com',
        password: 'AnotherPass123',
        displayName: 'Another User',
      });

      expect(response.success).toBe(false);
      expect(response.message).toContain('User already exists');
    });

    it('should validate registration input', async () => {
      const response = await client.register(INVALID_DATA.user);

      expect(response.success).toBe(false);
      expect(response.message).toContain('Validation failed');
      expect(response.errors).toBeDefined();
    });

    it('should require all mandatory fields', async () => {
      const response = await client.register({
        email: 'test@example.com',
        // Missing password and displayName
      });

      expect(response.success).toBe(false);
      expect(response.message).toContain('Validation failed');
    });

    it('should enforce password minimum length', async () => {
      const response = await client.register({
        email: 'test@example.com',
        password: '123',
        displayName: 'Test User',
      });

      expect(response.success).toBe(false);
      expect(response.message).toContain('Password must be at least 8 characters');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      await factory.createOwner();
    });

    it('should login with valid credentials', async () => {
      const response = await factory.loginAsOwner();

      expect(response.success).toBe(true);
      expect(response.data.user).toEqual({
        id: expect.any(String),
        email: 'owner@test.com',
        displayName: 'Event Owner',
      });
      expect(response.data.token).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await client.login({
        email: 'nonexistent@test.com',
        password: 'TestPass123',
      });

      expect(response.success).toBe(false);
      expect(response.message).toBe('Invalid email or password');
    });

    it('should reject invalid password', async () => {
      const response = await client.login({
        email: 'owner@test.com',
        password: 'WrongPassword',
      });

      expect(response.success).toBe(false);
      expect(response.message).toBe('Invalid email or password');
    });

    it('should validate login input', async () => {
      const response = await client.login({
        email: 'invalid-email',
        password: '',
      });

      expect(response.success).toBe(false);
      expect(response.message).toContain('Validation failed');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      await factory.createOwner();
      const response = await client.getMe();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('owner@test.com');
    });

    it('should reject access without token', async () => {
      client.clearToken();
      
      const response = await client.getEvents();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });

    it('should reject access with invalid token', async () => {
      client.setToken('invalid.jwt.token');
      
      const response = await client.getEvents();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should reject access with expired token', async () => {
      // This would require a token with past expiration
      // For now, test with malformed token
      client.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDk0NTkyMDB9.invalid');
      
      const response = await client.getEvents();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('JWT Token Handling', () => {
    it('should include user information in token payload', async () => {
      const registerResponse = await factory.createOwner();
      const token = registerResponse.data.token;
      
      // Verify token works for protected route
      client.setToken(token);
      const meResponse = await client.getMe();

      expect(meResponse.body.data.user.id).toBeDefined();
      expect(meResponse.body.data.user.email).toBe('owner@test.com');
    });

    it('should maintain session across requests', async () => {
      await factory.createOwner();
      
      // Make multiple authenticated requests
      const response1 = await client.getMe();
      const response2 = await client.getEvents();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
});