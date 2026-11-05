/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export const CalendarModes = {
  MONTH: 'month',
  WEEK: 'week',
};

const DAY_KEY_FORMAT = 'yyyy-MM-dd';

export const getDayKey = (date) => format(date, DAY_KEY_FORMAT);

export const buildCalendarRange = (anchor, mode, weekStartsOn) => {
  const options = { weekStartsOn };
  const isMonth = mode === CalendarModes.MONTH;

  return eachDayOfInterval({
    start: startOfWeek(isMonth ? startOfMonth(anchor) : anchor, options),
    end: endOfWeek(isMonth ? endOfMonth(anchor) : anchor, options),
  });
};

export const groupCardsByDay = (cards) => {
  const cardsByDay = {};
  let undatedCount = 0;

  cards.forEach((card) => {
    if (!card.dueDate) {
      undatedCount += 1;
      return;
    }

    const dayKey = getDayKey(card.dueDate);

    if (!cardsByDay[dayKey]) {
      cardsByDay[dayKey] = [];
    }

    cardsByDay[dayKey].push(card);
  });

  Object.values(cardsByDay).forEach((dayCards) => {
    dayCards.sort((a, b) => a.dueDate - b.dueDate);
  });

  return { cardsByDay, undatedCount };
};
