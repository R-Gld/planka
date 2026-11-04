/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { expect } = require('chai');

const { assertTestDatabaseUrl } = require('./test-database-url');

describe('PostgreSQL test harness', () => {
  it('answers native queries from PostgreSQL', async () => {
    const { rows } = await sails.sendNativeQuery('SELECT current_database() AS name');

    expect(rows[0].name).to.match(/_test$/);
  });

  it('has the tables created by the migrations', async () => {
    const { rows } = await sails.sendNativeQuery('SELECT to_regclass($1) AS name', ['public.card']);

    expect(rows[0].name).to.equal('card');
  });

  it('removes the rows left by a previous test', async () => {
    const { rows } = await sails.sendNativeQuery('SELECT count(*)::int AS total FROM project');

    expect(rows[0].total).to.equal(0);

    await sails.sendNativeQuery(
      `INSERT INTO project (name, is_hidden, created_at) VALUES ('Harness', false, now())`,
    );
  });

  it('starts the next test without those rows', async () => {
    const { rows } = await sails.sendNativeQuery('SELECT count(*)::int AS total FROM project');

    expect(rows[0].total).to.equal(0);
  });

  describe('assertTestDatabaseUrl', () => {
    it('accepts a database whose name ends with _test', () => {
      const url = 'postgresql://postgres@localhost/planka_test';

      expect(assertTestDatabaseUrl(url)).to.equal(url);
    });

    it('accepts query parameters after the name', () => {
      const url = 'postgresql://postgres@localhost/planka_test?sslmode=disable';

      expect(assertTestDatabaseUrl(url)).to.equal(url);
    });

    [
      'postgresql://postgres@localhost/planka',
      'postgresql://postgres@localhost/planka_test_copy',
    ].forEach((url) => {
      it(`refuses ${url}`, () => {
        expect(() => assertTestDatabaseUrl(url)).to.throw('_test');
      });
    });

    it('refuses a missing value', () => {
      expect(() => assertTestDatabaseUrl(undefined)).to.throw('TEST_DATABASE_URL');
    });

    it('does not reveal the password of a refused URL', () => {
      expect(() => assertTestDatabaseUrl('postgresql://user:hunter2@localhost/planka')).to.throw(
        /^(?!.*hunter2)/,
      );
    });
  });
});
