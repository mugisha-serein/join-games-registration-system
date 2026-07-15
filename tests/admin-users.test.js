const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');

const testDbPath = path.join(__dirname, '../database/test_users.db');
process.env.DATABASE_PATH = testDbPath;
process.env.SESSION_SECRET = 'test-session-secret-key-32-characters';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'ChangeMe123!';

const { app } = require('../server');
const { initializeDatabase } = require('../database/initialize');
const { close } = require('../database/connection');
const userRepository = require('../repositories/user.repository');

describe('Admin Users Moderation API Tests', () => {
  let agent;
  let testUserId;

  before(async () => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
    await initializeDatabase();

    // Authenticate admin agent session
    agent = request.agent(app);
    await agent
      .post('/api/admin/login')
      .send({
        email: 'admin@example.com',
        password: 'ChangeMe123!'
      });

    // Create a pending test user manually in the DB for moderation tests
    testUserId = await userRepository.createUser({
      fullName: 'Moderate Ninja',
      phoneNumber: '+15559998888',
      shortComment: 'Verify my skills',
      joinType: 'ninja_region_family',
      termsAccepted: true,
      termsVersion: '1.0',
      termsAcceptedAt: new Date().toISOString()
    });
  });

  after(async () => {
    await close();
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
  });

  it('should block unauthorized requests to users list', async () => {
    const res = await request(app).get('/api/admin/users');
    assert.strictEqual(res.status, 401);
  });

  it('should retrieve a list of users with pagination for admin', async () => {
    const res = await agent.get('/api/admin/users?page=1&limit=20');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.pagination.total, 1);
  });

  it('should retrieve statistics showing pending counts', async () => {
    const res = await agent.get('/api/admin/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.total, 1);
    assert.strictEqual(res.body.data.pending, 1);
  });

  it('should fetch details of a specific user', async () => {
    const res = await agent.get(`/api/admin/users/${testUserId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.full_name, 'Moderate Ninja');
  });

  it('should successfully ban the user', async () => {
    const res = await agent.patch(`/api/admin/users/${testUserId}/ban`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.user);
    
    // Check status in DB
    const dbUser = await userRepository.getUserById(testUserId);
    assert.strictEqual(dbUser.status, 'banned');
  });

  it('should successfully approve the banned user', async () => {
    const res = await agent.patch(`/api/admin/users/${testUserId}/approve`);
    assert.strictEqual(res.status, 200);
    
    const dbUser = await userRepository.getUserById(testUserId);
    assert.strictEqual(dbUser.status, 'approved');
  });

  it('should successfully soft-remove the user', async () => {
    const res = await agent.delete(`/api/admin/users/${testUserId}`);
    assert.strictEqual(res.status, 200);

    const dbUser = await userRepository.getUserById(testUserId);
    assert.strictEqual(dbUser.status, 'removed');
    assert.ok(dbUser.deleted_at !== null);
  });

  it('should reject banning a removed user (invalid transition)', async () => {
    const res = await agent.patch(`/api/admin/users/${testUserId}/ban`);
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /Cannot ban a removed user/);
  });

  it('should reject approving a removed user (invalid transition)', async () => {
    const res = await agent.patch(`/api/admin/users/${testUserId}/approve`);
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /Only pending or banned/);
  });

  it('should successfully restore the removed user to pending', async () => {
    const res = await agent.patch(`/api/admin/users/${testUserId}/restore`);
    assert.strictEqual(res.status, 200);

    const dbUser = await userRepository.getUserById(testUserId);
    assert.strictEqual(dbUser.status, 'pending');
    assert.strictEqual(dbUser.deleted_at, null);
  });
});
