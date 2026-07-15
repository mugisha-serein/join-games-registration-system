const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const request = require('supertest');

// Set temporary database path for test suite before importing app
const testDbPath = path.join(__dirname, '../database/test_reg.db');
process.env.DATABASE_PATH = testDbPath;
process.env.SESSION_SECRET = 'test-session-secret-key-32-characters';

const { app } = require('../server');
const { initializeDatabase } = require('../database/initialize');
const { close } = require('../database/connection');

describe('Public Registration API Tests', () => {
  before(async () => {
    // Delete test database if it exists
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

  it('should successfully register a user when all fields are valid', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        fullName: 'Test Ninja',
        phoneNumber: '+15550000001',
        shortComment: 'I love shadows',
        joinType: 'ninja_region_family',
        termsAccepted: true,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
  });

  it('should reject registration if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        phoneNumber: '+15550000002',
        joinType: 'ninja_region_family',
        termsAccepted: true,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.fullName);
  });

  it('should reject registration if terms are not accepted', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        fullName: 'No Terms Ninja',
        phoneNumber: '+15550000003',
        joinType: 'ninja_region_family',
        termsAccepted: false,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.termsAccepted);
  });

  it('should reject registration if join type is invalid', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        fullName: 'Bad Join Ninja',
        phoneNumber: '+15550000004',
        joinType: 'invalid_join_type',
        termsAccepted: true,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.joinType);
  });

  it('should reject registration if phone number has too few digits', async () => {
    const res = await request(app)
      .post('/api/registrations')
      .send({
        fullName: 'Short Phone Ninja',
        phoneNumber: '12345',
        joinType: 'tiktok_game',
        termsAccepted: true,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.phoneNumber);
  });

  it('should reject registration with a duplicate phone number', async () => {
    // Attempt duplicate using the phone number registered in the first test (+15550000001)
    const res = await request(app)
      .post('/api/registrations')
      .send({
        fullName: 'Duplicate Ninja',
        phoneNumber: '+1 555-000-0001', // Slightly different format, but same normalized number
        joinType: 'tiktok_game',
        termsAccepted: true,
        termsVersion: '1.0'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /already registered/);
  });
});
