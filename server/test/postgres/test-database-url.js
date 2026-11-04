/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// The harness drops the whole schema of the database it connects to, so it only
// accepts one that is unmistakably disposable. A mistyped variable must not be able
// to reach a development or production database.
const assertTestDatabaseUrl = (url) => {
  if (!url) {
    throw new Error('TEST_DATABASE_URL is required to run the PostgreSQL test suite');
  }

  const databaseName = new URL(url).pathname.slice(1);

  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing database "${databaseName}": its name must end with _test`);
  }

  return url;
};

module.exports = {
  assertTestDatabaseUrl,
};
