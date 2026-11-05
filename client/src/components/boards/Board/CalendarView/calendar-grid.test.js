import { format } from 'date-fns';

import { buildCalendarRange, groupCardsByDay } from './calendar-grid';

const MONDAY = 1;
const SUNDAY = 0;

const toDayKeys = (days) => days.map((day) => format(day, 'yyyy-MM-dd'));

describe('buildCalendarRange', () => {
  test('starts a month on the Monday before its first day', () => {
    // April 2026 starts on a Wednesday
    const days = toDayKeys(buildCalendarRange(new Date(2026, 3, 15), 'month', MONDAY));

    expect(days[0]).toBe('2026-03-30');
    expect(days[days.length - 1]).toBe('2026-05-03');
    expect(days).toHaveLength(35);
  });

  test('includes February 29 of a leap year', () => {
    const days = toDayKeys(buildCalendarRange(new Date(2028, 1, 10), 'month', MONDAY));

    expect(days).toContain('2028-02-29');
    expect(days[days.length - 1]).toBe('2028-03-05');
  });

  test('covers exactly one week in week mode', () => {
    const days = toDayKeys(buildCalendarRange(new Date(2026, 3, 15), 'week', MONDAY));

    expect(days).toEqual([
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
    ]);
  });

  test('follows a locale whose week starts on Sunday', () => {
    const days = toDayKeys(buildCalendarRange(new Date(2026, 3, 15), 'week', SUNDAY));

    expect(days[0]).toBe('2026-04-12');
    expect(days[6]).toBe('2026-04-18');
  });

  test('neither skips nor repeats a day when the clocks change', () => {
    // Clocks go forward on March 29 2026 and back on October 25 2026 in Europe/Paris
    expect(process.env.TZ).toBe('Europe/Paris');

    expect(toDayKeys(buildCalendarRange(new Date(2026, 2, 29), 'week', MONDAY))).toEqual([
      '2026-03-23',
      '2026-03-24',
      '2026-03-25',
      '2026-03-26',
      '2026-03-27',
      '2026-03-28',
      '2026-03-29',
    ]);

    expect(toDayKeys(buildCalendarRange(new Date(2026, 9, 25), 'week', MONDAY))).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
  });
});

describe('groupCardsByDay', () => {
  test('groups two due dates of the same local day, earliest first', () => {
    const late = { id: '1', dueDate: new Date(2026, 3, 15, 18, 0) };
    const early = { id: '2', dueDate: new Date(2026, 3, 15, 9, 0) };

    const { cardsByDay } = groupCardsByDay([late, early]);

    expect(cardsByDay['2026-04-15']).toEqual([early, late]);
  });

  test('keeps a late evening due date on its local day', () => {
    const card = { id: '1', dueDate: new Date(2026, 3, 15, 23, 30) };

    const { cardsByDay } = groupCardsByDay([card]);

    expect(Object.keys(cardsByDay)).toEqual(['2026-04-15']);
  });

  test('counts cards without a due date apart', () => {
    const dated = { id: '1', dueDate: new Date(2026, 3, 15) };

    const { cardsByDay, undatedCount } = groupCardsByDay([
      dated,
      { id: '2', dueDate: null },
      { id: '3' },
    ]);

    expect(undatedCount).toBe(2);
    expect(cardsByDay['2026-04-15']).toEqual([dated]);
  });
});
