import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { format } from 'date-fns';

import Config from '../Config.js';

const CARD_NAME = 'Calendar Card';

let accessToken;
let boardId;
let listId;

const post = async (path, body) => {
  const response = await fetch(`${Config.BASE_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify(body),
  });

  const { item } = await response.json();
  return item;
};

const getTodayCell = () => page.locator(`[data-day="${format(new Date(), 'yyyy-MM-dd')}"]`);

// ---------- GIVEN ----------

Given('a board with a card due today exists', async () => {
  accessToken = undefined;
  accessToken = await post('/access-tokens', { emailOrUsername: 'demo', password: 'demo' });

  const project = await post('/projects', {
    name: `Calendar View Test ${Date.now()}`,
    type: 'private',
  });

  const board = await post(`/projects/${project.id}/boards`, {
    name: 'Test Board',
    position: 65536,
  });

  const list = await post(`/boards/${board.id}/lists`, {
    name: 'Test List',
    position: 65536,
    type: 'active',
  });

  await post(`/lists/${list.id}/cards`, {
    name: CARD_NAME,
    position: 65536,
    type: 'project',
    dueDate: new Date().toISOString(),
  });

  boardId = board.id;
  listId = list.id;
});

Given('the board also has a card without a due date', async () => {
  await post(`/lists/${listId}/cards`, {
    name: 'Undated Card',
    position: 131072,
    type: 'project',
  });
});

// ---------- WHEN ----------

When('the user opens the board', async () => {
  await page.goto(`${Config.BASE_URL}/boards/${boardId}`);
});

When('the user switches to the calendar view', async () => {
  await page.click('button[value="calendar"]');
});

When('the user opens the card from the calendar', async () => {
  await getTodayCell().getByText(CARD_NAME).click();
});

When('the user closes the card modal', async () => {
  await page.keyboard.press('Escape');
});

// ---------- THEN ----------

Then('the card should appear on today in the calendar', async () => {
  await expect(getTodayCell().getByText(CARD_NAME)).toBeVisible();
});

Then('the card modal should be displayed', async () => {
  await expect(page).toHaveURL(/\/cards\//);
  await expect(page.locator('.ui.modal')).toBeVisible();
});

Then('the calendar view should still be selected', async () => {
  await expect(page).toHaveURL(new RegExp(`/boards/${boardId}`));
  await expect(page.locator('button[value="calendar"]')).toBeDisabled();
  await expect(getTodayCell().getByText(CARD_NAME)).toBeVisible();
});

Then('the calendar should report {int} card without a due date', async (count) => {
  await expect(page.getByText(`${count} card without a due date is not shown.`)).toBeVisible();
});
