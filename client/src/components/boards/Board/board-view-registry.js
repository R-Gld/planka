/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { BoardViews } from '../../../constants/Enums';
import CalendarView from './CalendarView';
import GridView from './GridView';
import ListView from './ListView';

// Kept apart from the metadata, which the header needs and which tests can load without
// any component. Kanban is absent on purpose: Board renders it without FiniteContent.
const COMPONENT_BY_VIEW = {
  [BoardViews.GRID]: GridView,
  [BoardViews.LIST]: ListView,
  [BoardViews.CALENDAR]: CalendarView,
};

export default (id) => COMPONENT_BY_VIEW[id];
