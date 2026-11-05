import { BoardContexts, BoardViews } from '../../../constants/Enums';
import { getBoardView, getSelectableBoardViews } from './board-view-meta';

const idsOf = (views) => views.map(({ id }) => id);

describe('getSelectableBoardViews', () => {
  test('offers every view on a regular board, kanban first', () => {
    expect(idsOf(getSelectableBoardViews(BoardContexts.BOARD))).toEqual(['kanban', 'grid', 'list']);
  });

  test('offers no kanban in the archive', () => {
    expect(idsOf(getSelectableBoardViews(BoardContexts.ARCHIVE))).toEqual(['grid', 'list']);
  });

  test('offers no kanban in the trash', () => {
    expect(idsOf(getSelectableBoardViews(BoardContexts.TRASH))).toEqual(['grid', 'list']);
  });
});

describe('getBoardView', () => {
  test('lays grid and list out vertically, unlike kanban', () => {
    expect(getBoardView(BoardViews.GRID).isVerticalLayout).toBe(true);
    expect(getBoardView(BoardViews.LIST).isVerticalLayout).toBe(true);
    expect(getBoardView(BoardViews.KANBAN).isVerticalLayout).toBe(false);
  });

  test('returns nothing for a view that does not exist', () => {
    expect(getBoardView('unknown')).toBeUndefined();
  });
});
