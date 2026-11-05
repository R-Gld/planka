/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { addMonths, addWeeks, isSameDay, isSameMonth } from 'date-fns';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import Paths from '../../../../constants/Paths';
import ViewNotice from '../ViewNotice';
import { buildCalendarRange, CalendarModes, getDayKey, groupCardsByDay } from './calendar-grid';

import styles from './CalendarView.module.scss';

const MAX_CARDS_PER_DAY = 4;

const CalendarView = React.memo(() => {
  const cards = useSelector(selectors.selectFilteredCardsForCurrentBoard);

  const [t, i18n] = useTranslation();
  const [anchor, setAnchor] = useState(() => new Date());
  const [mode, setMode] = useState(CalendarModes.MONTH);
  const [expandedDayKey, setExpandedDayKey] = useState(null);

  const weekStartsOn = i18n.dateFns.getLocale()?.options?.weekStartsOn ?? 0;

  const days = useMemo(
    () => buildCalendarRange(anchor, mode, weekStartsOn),
    [anchor, mode, weekStartsOn],
  );

  const { cardsByDay, undatedCount } = useMemo(() => groupCardsByDay(cards), [cards]);

  const handleMoveClick = useCallback(
    (amount) => {
      setAnchor((prevAnchor) =>
        mode === CalendarModes.MONTH ? addMonths(prevAnchor, amount) : addWeeks(prevAnchor, amount),
      );
      setExpandedDayKey(null);
    },
    [mode],
  );

  const handleTodayClick = useCallback(() => {
    setAnchor(new Date());
    setExpandedDayKey(null);
  }, []);

  const today = new Date();

  const title =
    mode === CalendarModes.MONTH
      ? i18n.dateFns.format(anchor, 'LLLL yyyy')
      : `${i18n.dateFns.format(days[0], 'PP')} – ${i18n.dateFns.format(days[6], 'PP')}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button
          type="button"
          aria-label={t('action.showPreviousPeriod')}
          className={styles.button}
          onClick={() => handleMoveClick(-1)}
        >
          <Icon fitted name="chevron left" />
        </button>
        <button type="button" className={styles.button} onClick={handleTodayClick}>
          {t('common.today')}
        </button>
        <button
          type="button"
          aria-label={t('action.showNextPeriod')}
          className={styles.button}
          onClick={() => handleMoveClick(1)}
        >
          <Icon fitted name="chevron right" />
        </button>
        <h2 className={styles.title}>{title}</h2>
        {Object.values(CalendarModes).map((value) => (
          <button
            key={value}
            type="button"
            disabled={value === mode}
            className={classNames(styles.button, value === mode && styles.buttonActive)}
            onClick={() => setMode(value)}
          >
            {t(`common.${value}`)}
          </button>
        ))}
      </div>
      <ViewNotice
        unplacedText={
          undatedCount > 0 ? t('common.cardsWithoutDueDate', { count: undatedCount }) : undefined
        }
      />
      <div className={styles.scroller}>
        <div className={styles.grid}>
          {days.slice(0, 7).map((day) => (
            <div key={day.getDay()} className={styles.weekday}>
              {i18n.dateFns.format(day, 'EEE')}
            </div>
          ))}
          {days.map((day) => {
            const dayKey = getDayKey(day);
            const dayCards = cardsByDay[dayKey] || [];
            const isExpanded = expandedDayKey === dayKey;
            const visibleCards = isExpanded ? dayCards : dayCards.slice(0, MAX_CARDS_PER_DAY);
            const hiddenCount = dayCards.length - visibleCards.length;

            return (
              <div
                key={dayKey}
                data-day={dayKey}
                className={classNames(
                  styles.day,
                  mode === CalendarModes.MONTH && !isSameMonth(day, anchor) && styles.dayOutside,
                )}
              >
                <div className={classNames(styles.date, isSameDay(day, today) && styles.dateToday)}>
                  {i18n.dateFns.format(day, 'd')}
                </div>
                {visibleCards.map((card) => (
                  <Link
                    key={card.id}
                    to={Paths.CARDS.replace(':id', card.id)}
                    title={`${card.name} (${i18n.dateFns.format(card.dueDate, 'PPp')})`}
                    className={classNames(styles.card, card.isDueCompleted && styles.cardCompleted)}
                  >
                    {card.name}
                  </Link>
                ))}
                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className={styles.more}
                    onClick={() => setExpandedDayKey(dayKey)}
                  >
                    {t('common.moreCards', { count: hiddenCount })}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default CalendarView;
