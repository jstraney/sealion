const
knex = require('knex');

const {
  NODE_ENV = 'production',
  SEALION_DB_CLIENT,
  SEALION_DB_FILE,
  SEALION_DB_HOST,
  SEALION_DB_PORT,
  SEALION_DB_USER,
  SEALION_DB_PASSWORD,
  SEALION_DB_DATABASE,
  SEALION_DB_MIN_POOL = 0,
  SEALION_DB_MAX_POOL = 10,
} = process.env;

const {
  getIfSet,
} = require('@owo/lib/collection');

const dbs = {};

const logger = require('./logger')('@owo/lib/db');

const canLoadDB = async (uniqueName = 'default', config) => {

  try {

    const db = await loadDB(uniqueName, config);

    await db('sealionOption').limit(1);

    return true;

  } catch (error) {

    return false;

  }

  return true;

};

const loadDB = async (uniqueName = 'default', config = {}) => {

  const db = getIfSet(dbs, uniqueName);

  if (db !== null) {
    return db;
  }

  logger.debug(`creating new database instance, "${uniqueName}"`);

  const {
    dbClient = SEALION_DB_CLIENT,
    dbUser = SEALION_DB_USER,
    dbPass = SEALION_DB_PASSWORD,
    dbHost = SEALION_DB_HOST,
    dbPort = SEALION_DB_PORT,
    dbDatabase = SEALION_DB_DATABASE,
    dbFilename = SEALION_DB_FILE,
    dbMaxPool = SEALION_DB_MAX_POOL,
    dbMinPool = SEALION_DB_MIN_POOL,
  } = config;

  const instance = dbClient === 'sqlite3'
    ? knex({
        client: dbClient,
        connection: {
          filename: dbFilename,
        },
        useNullAsDefault: true,
        debug: NODE_ENV === 'debug' ? true: false,
        asyncStackTraces: NODE_ENV === 'debug' ? true: false,
        pool: {
          min: dbMinPool,
          max: dbMaxPool,
        },
      })
    : knex({
      client: dbClient,
      connection: {
        host: dbHost,
        user: dbUser,
        password: dbPass,
        database: dbDatabase,
      },
      debug: NODE_ENV === 'debug' ? true: false,
      asyncStackTraces: NODE_ENV === 'debug' ? true: false,
      pool: {
        min: dbMinPool,
        max: dbMaxPool,
      },
    });

  dbs[uniqueName] = instance;

  return instance;

};

const destroyDBs = () => {

  logger.debug('database pools being destroyed');

  for (uniqueName in dbs) {

    dbs[uniqueName].destroy();

  }

};

module.exports = {
  canLoadDB,
  loadDB,
  destroyDBs,
};
