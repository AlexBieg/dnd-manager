import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Roller from 'components/Roller';
import RollerOutput from 'components/RollOutput';
import { getRollerbarWidth, settingsSetRollerbarWidth } from 'reducers/settings';

import './RollerBar.scss';

const RollerBar = () => {
  const width = useSelector(getRollerbarWidth);
  const dispatch = useDispatch();

  return (
    <div className="roller-bar" style={{ width }}>
      <div
        className="roller-bar-drag-handle"
        draggable
        onDragEnd={e => dispatch(settingsSetRollerbarWidth(window.innerWidth - e.clientX)) }/>
      <div className="roller-bar-content">
        <Roller />
        <RollerOutput />
      </div>
    </div>
  )
};

export default RollerBar;