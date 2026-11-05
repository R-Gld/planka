/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { BoardContexts, BoardViews } from '../../../constants/Enums';
import { BoardViewIcons } from '../../../constants/Icons';

// Above this, a view shows a part of its items and says so rather than rendering them all
export const MAX_RENDERED_ITEMS = 2000;

const ALL_CONTEXTS = [BoardContexts.BOARD, BoardContexts.ARCHIVE, BoardContexts.TRASH];

// One complete sentence per view rather than a view name interpolated into a
// frame. A name that has to fit a slot has to be inflected to fit it, and the
// frame is not the same shape in every language.
const BOARD_VIEWS = [
  {
    id: BoardViews.KANBAN,
    icon: BoardViewIcons[BoardViews.KANBAN],
    labelKey: 'common.kanban',
    tooltipKey: 'action.switchToKanbanView',
    descriptionKey: 'common.visualTaskManagementWithLists',
    contexts: [BoardContexts.BOARD],
    isVerticalLayout: false,
  },
  {
    id: BoardViews.GRID,
    icon: BoardViewIcons[BoardViews.GRID],
    labelKey: 'common.grid',
    tooltipKey: 'action.switchToGridView',
    descriptionKey: 'common.dynamicAndUnevenlySpacedLayout',
    contexts: ALL_CONTEXTS,
    isVerticalLayout: true,
  },
  {
    id: BoardViews.LIST,
    icon: BoardViewIcons[BoardViews.LIST],
    labelKey: 'common.list',
    tooltipKey: 'action.switchToListView',
    descriptionKey: 'common.sequentialDisplayOfCards',
    contexts: ALL_CONTEXTS,
    isVerticalLayout: true,
  },
];

export const getBoardView = (id) => BOARD_VIEWS.find((view) => view.id === id);

export const getSelectableBoardViews = (context) =>
  BOARD_VIEWS.filter(({ contexts }) => contexts.includes(context));
