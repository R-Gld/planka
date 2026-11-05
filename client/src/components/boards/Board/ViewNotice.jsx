/*!
 * Part of a modified version of PLANKA (R-Gld/planka).
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';

import { MAX_RENDERED_ITEMS } from './board-view-meta';

import styles from './ViewNotice.module.scss';

// A card a view cannot place must be counted rather than silently left out, so that an
// empty-looking view is never mistaken for an empty board
const ViewNotice = React.memo(({ unplacedText, total }) => {
  const [t] = useTranslation();

  const isLimited = total > MAX_RENDERED_ITEMS;

  if (!unplacedText && !isLimited) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <Icon fitted name="info circle" />
      {unplacedText && <span className={styles.text}>{unplacedText}</span>}
      {isLimited && (
        <span className={styles.text}>
          {t('common.viewLimitReached', { shown: MAX_RENDERED_ITEMS, total })}
        </span>
      )}
    </div>
  );
});

ViewNotice.propTypes = {
  unplacedText: PropTypes.string,
  total: PropTypes.number,
};

ViewNotice.defaultProps = {
  unplacedText: undefined,
  total: 0,
};

export default ViewNotice;
