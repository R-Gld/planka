/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';
import { Tooltip } from '../../../../lib/custom-ui';
import { usePopup } from '../../../../lib/popup';

import selectors from '../../../../selectors';
import entryActions from '../../../../entry-actions';
import { getSelectableBoardViews } from '../../Board/board-view-meta';
import ActionsStep from './ActionsStep';

import styles from './RightSide.module.scss';

const RightSide = React.memo(() => {
  const board = useSelector(selectors.selectCurrentBoard);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleSelectViewClick = useCallback(
    ({ currentTarget: { value: view } }) => {
      dispatch(entryActions.updateViewInCurrentBoard(view));
    },
    [dispatch],
  );

  const ActionsPopup = usePopup(ActionsStep);

  return (
    <>
      <div className={styles.action}>
        <div className={styles.buttonGroup}>
          {getSelectableBoardViews(board.context).map(({ id, icon, tooltipKey }) => (
            <Tooltip key={id} content={t(tooltipKey)} disabled={id === board.view}>
              <button
                type="button"
                value={id}
                disabled={id === board.view}
                className={styles.button}
                onClick={handleSelectViewClick}
              >
                <Icon fitted name={icon} />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className={styles.action}>
        <ActionsPopup>
          <Tooltip content={t('common.openBoardActions')}>
            <button type="button" className={styles.button}>
              <Icon fitted name="ellipsis vertical" />
            </button>
          </Tooltip>
        </ActionsPopup>
      </div>
    </>
  );
});

export default RightSide;
