/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { expect } = require('chai');
const request = require('supertest');
const bcrypt = require('bcrypt');

describe('PATCH /api/boards/:id (defaultView)', () => {
  const suffix = Date.now();
  let idCounter = 0;

  const nextId = () => {
    idCounter += 1;
    return `${suffix}${idCounter}`;
  };

  let user;
  let session;
  let project;
  let projectManager;
  let board;
  let accessToken;

  const updateDefaultView = (defaultView) =>
    request(sails.hooks.http.app)
      .patch(`/api/boards/${board.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ defaultView });

  before(async () => {
    user = await User.qm.createOne({
      id: nextId(),
      email: `board-view-${suffix}@test.test`,
      password: await bcrypt.hash('password', 4),
      role: User.Roles.PROJECT_OWNER,
      name: 'Board View',
    });

    ({ token: accessToken } = sails.helpers.utils.createJwtToken(user.id, new Date(), 60 * 60));

    session = await Session.qm.createOne({
      id: nextId(),
      accessToken,
      userId: user.id,
      remoteAddress: '127.0.0.1',
    });

    project = await Project.create({ id: nextId(), name: 'Board View' }).fetch();

    projectManager = await ProjectManager.create({
      id: nextId(),
      projectId: project.id,
      userId: user.id,
    }).fetch();

    board = await Board.create({
      id: nextId(),
      projectId: project.id,
      position: 1,
      name: 'Board',
      defaultView: Board.Views.KANBAN,
    }).fetch();
  });

  after(async () => {
    await Board.destroy({ id: board.id });
    await ProjectManager.destroy({ id: projectManager.id });
    await Project.destroy({ id: project.id });
    await Session.destroy({ id: session.id });
    await User.destroy({ id: user.id });
  });

  it('accepts the calendar view', async () => {
    const response = await updateDefaultView('calendar');

    expect(response.status).to.equal(200);
    expect(response.body.item.defaultView).to.equal('calendar');
  });

  it('rejects a view that does not exist', async () => {
    const response = await updateDefaultView('unknown');

    expect(response.status).to.equal(400);
  });
});
