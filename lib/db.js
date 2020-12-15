const
knex = require('knex');

const {
  NODE_ENV = 'production',
  SEALION_DB_CLIENT,
  SEALION_DB_FILE,
  SEALION_DB_HOST,
  SEALION_DB_USER,
  SEALION_DB_PASSWORD,
  SEALION_DB_DATABASE,
  SEALION_DB_MIN_POOL = 0,
  SEALION_DB_MAX_POOL = 10,
} = process.env;

const db = SEALION_DB_CLIENT === 'sqlite3'
  ? knex({
      client: SEALION_DB_CLIENT,
      connection: {
        filename: SEALION_DB_FILE,
      },
      useNullAsDefault: true,
      debug: NODE_ENV === 'debug' ? true: false,
      asyncStackTraces: NODE_ENV === 'debug' ? true: false,
      pool: {
        min: SEALION_DB_MIN_POOL,
        max: SEALION_DB_MAX_POOL,
      },
    })
  : knex({
    client: SEALION_DB_CLIENT,
    connection: {
      host: SEALION_DB_HOST,
      user: SEALION_DB_USER,
      password: SEALION_DB_PASSWORD,
      database: SEALION_DB_DATABASE,
    },
    debug: NODE_ENV === 'debug' ? true: false,
    asyncStackTraces: NODE_ENV === 'debug' ? true: false,
    pool: {
      min: SEALION_DB_MIN_POOL,
      max: SEALION_DB_MAX_POOL,
    },
  });

module.exports = db;
