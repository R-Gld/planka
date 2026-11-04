/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Icon, Menu } from 'semantic-ui-react';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { BoardContexts } from '../../../../constants/Enums';
import { getSelectableBoardViews } from '../../Board/board-view-meta';

import styles from './DefaultView.module.scss';

const DefaultView = React.memo(() => {
  const selectBoardById = useMemo(() => selectors.makeSelectBoardById(), []);

  const boardId = useSelector((state) => selectors.selectCurrentModal(state).params.id);
  const board = useSelector((state) => selectBoardById(state, boardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleSelectClick = useCallback(
    (_, { value: defaultView }) => {
      dispatch(
        entryActions.updateBoard(boardId, {
          defaultView,
        }),
      );
    },
    [boardId, dispatch],
  );

  return (
    <Menu secondary vertical className={styles.menu}>
      {getSelectableBoardViews(BoardContexts.BOARD).map(
        ({ id, icon, labelKey, descriptionKey }) => (
          <Menu.Item
            key={id}
            value={id}
            active={id === board.defaultView}
            className={styles.menuItem}
            onClick={handleSelectClick}
          >
            <Icon name={icon} className={styles.menuItemIcon} />
            <div className={styles.menuItemTitle}>{t(labelKey)}</div>
            <p className={styles.menuItemDescription}>{t(descriptionKey)}</p>
          </Menu.Item>
        ),
      )}
    </Menu>
  );
});

export default DefaultView;
