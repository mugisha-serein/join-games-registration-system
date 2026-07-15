const { getDatabase, runAsync, allAsync } = require('./connection');

async function initializeDatabase() {
  try {
    const db = getDatabase();

    // Enable foreign keys
    await runAsync('PRAGMA foreign_keys = ON');

    // Create users table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE,
        short_comment TEXT,
        join_type TEXT NOT NULL CHECK (
          join_type IN ('ninja_region_family', 'tiktok_game')
        ),
        terms_accepted INTEGER NOT NULL CHECK (
          terms_accepted IN (0, 1)
        ),
        terms_version TEXT NOT NULL,
        terms_accepted_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (
          status IN ('pending', 'approved', 'banned', 'removed')
        ),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TEXT
      )
    `);

    // Create indexes for common queries
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_phone_number ON users(phone_number)`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_status ON users(status)`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_join_type ON users(join_type)`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at)`
    );

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
};
