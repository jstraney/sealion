const path = require('path');

const {
  implementReduce,
} = require('../lib/hook');

const {
  sealionRequireMigrations,
  sealionCorePath,
  sealionProjectPath,
} = require('../lib/sealion');

implementReduce('cliHelp', (allHelp) => ({
  ...allHelp,
  migrate: {
    description: 'create/rollback migrations',
    usage: 'sealion migrate <op> <args>...',
    subCommands: ['up', 'down', 'rollback', 'current-version', 'list'],
  },
  migrateUp: {
    description: 'Run the "up" method of a specific migration. defaults to latest',
    examples: ['sealion migrate up', 'sealion up <migration1>, <migration2>...'],
  },
  migrateDown: {
    description: 'Run the "down" method of a specific migration. defaults to latest',
    examples: ['sealion migrate down', 'sealion down <migration1>, <migration2>...'],
  },
  migrateCurrentVersion: {
    description: 'Shows the present migration version',
    examples: ['sealion migrate current-version'],
  },
  migrateList: {
    description: 'Lists all available migration files',
    examples: ['sealion migrate list'],
  },
  migrateRollback: {
    description: 'Rollback migrations. Defaults to latest',
    examples: ['sealion migrate rollback', 'sealion migrate <migration1>, <migration2>...'],
  },
  migrateUnlock: {
    description: 'Unlocks migration table',
    examples: ['sealion migrate unlock'],
  },
}));

implementReduce('migrateDefineCliArgs', () => [
  { name: 'sub-command', type: String, defaultOption: true },
  { name: 'migrations', alias: 'm', type: String, multiple: true },
]);

implementReduce('migrateRunDefineCliArgs', () => [
  { name: 'migrations', alias: 'm', type: String, multiple: true },
]);

module.exports = async ({ 'sub-command': op = 'run', migrations = [] }) => {

  const db = require('../lib/db');

  const defaultConfig = {
    // TODO: allow path
    directory: [
      sealionCorePath(),
      sealionProjectPath(),
    ].map((abs) => path.join(abs, '/migrate')),
    extension: 'js',
    loadExtensions: ['.js'],
    tableName: 'sl_migration',
  };

  let result = null;

  // generates a migration file
  if (op === 'create') {

    for(let i = 0; i < migrations.length; i++) {

      const migrationName = migrations[i];

      result = await db.migrate.make(migrationName, {
        ...defaultConfig,
        directory: path.join(sealionProjectPath(), '/migrate'),
      });

    }

  } else if (op === 'up') {

    if (!migrations.length) {

      result = await db.migrate.up(defaultConfig);

    } else {

      for(let i = 0; i < migrations.length; i++) {

        const migrationName = migrations[i];

        result = await db.migrate.up({
          ...defaultConfig,
          name: migrationName.concat('.js'),
        });

      }

    }

  } else if (op === 'down') {

    if (!migrations.length) {
      result = await db.migrate.down(defaultConfig);
    } else {

      for(let i = 0; i < migrations.length; i++) {

        const migrationName = migrations[i];

        result = await db.migrate.down({
          ...defaultConfig,
          name: migrationName.concat('.js'),
        });

      }
    }

  } else if (op === 'rollback') {

    result = await db.migrate.rollback(defaultConfig);

  } else if (op === 'current-version') {

    result = await db.migrate.currentVersion(defaultConfig);

  } else if (op === 'list') {

    result = await db.migrate.list(defaultConfig);

  } else if (op === 'unlock') {

    result = await db.migrate.forceFreeMigrationsLock(defaultConfig);

  } else {

    db.destroy();

    throw Error(`unknown sealion migrate command "${op}". Try sealion migrate help`);

  }

  db.destroy();

  return result;

};
