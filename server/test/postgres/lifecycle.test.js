/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const initKnex = require('knex');
const sails = require('sails');
const rc = require('sails/accessible/rc');

const { assertTestDatabaseUrl } = require('./test-database-url');

process.env.NODE_ENV = 'test';

// Set before anything loads the environment file, which never overrides a variable
// that already exists: knex and the app must both end up on this database
const url = assertTestDatabaseUrl(process.env.TEST_DATABASE_URL);
process.env.DATABASE_URL = url;

// Required only now, as it resolves the connection as soon as it is loaded
const knexfile = require('../../db/knexfile');

// Rows the app expects to always exist, and the migrations' own bookkeeping
const PRESERVED_TABLES = ['migration', 'migration_lock', 'internal_config'];

const recreateSchema = async () => {
  const knex = initKnex(knexfile);

  try {
    await knex.raw('DROP SCHEMA public CASCADE');
    await knex.raw('CREATE SCHEMA public');
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
};

before(async function beforeCallback() {
  this.timeout(60000);

  await recreateSchema();

  await new Promise((resolve, reject) => {
    sails.lift(
      {
        ...rc('sails'),
        datastores: {
          default: {
            adapter: 'sails-postgresql',
            url,
          },
        },
      },
      (error) => (error ? reject(error) : resolve()),
    );
  });
});

afterEach(async () => {
  const { rows } = await sails.sendNativeQuery(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT (tablename = ANY($1))`,
    [PRESERVED_TABLES],
  );

  if (rows.length > 0) {
    const tables = rows.map(({ tablename }) => `"${tablename}"`).join(', ');

    await sails.sendNativeQuery(`TRUNCATE ${tables} CASCADE`);
  }
});

after((done) => {
  sails.lower(done);
});
