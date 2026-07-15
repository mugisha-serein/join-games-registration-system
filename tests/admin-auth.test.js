const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');

const testDbPath = path.join(__dirname, '../database/test_auth.db');
process.env.DATABASE_PATH = testDbPath;
process.env.SESSION_SECRET = 'test-session-secret-key-32-characters';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'ChangeMe123!';

const { app } = require('../server');
const { initializeDatabase } = require('../database/initialize');
const { close } = require('../database/connection');

describe('Admin Authentication API Tests', () => {
  before(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
    await initializeDatabase();
  });

  after(async () => {
    await close();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  it('should reject unauthenticated session checks', async () => {
    const res = await request(app)
      .get('/api/admin/session');
    
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('should reject login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'WrongPassword123'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Invalid email/);
  });

  it('should successfully log in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'ChangeMe123!'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.headers['set-cookie']);
  });

  it('should allow session checking after successful login', async () => {
    const agent = request.agent(app);
    
    // Perform login first
    await agent
      .post('/api/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'ChangeMe123!'
      });

    // Check session
    const res = await agent.get('/api/admin/session');
    
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.admin, true);
  });

  it('should terminate the session on logout', async () => {
    const agent = request.agent(app);
    
    // Log in
    await agent
      .post('/api/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'ChangeMe123!'
      });

    // Log out
    const logoutRes = await agent.post('/api/admin/logout');
    assert.strictEqual(logoutRes.status, 200);

    // Verify session is now unauthorized
    const sessionRes = await agent.get('/api/admin/session');
    assert.strictEqual(sessionRes.status, 401);
  });
});
