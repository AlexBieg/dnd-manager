import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Roller from 'components/Roller';
import RollerOutput from 'components/RollOutput';
import DragBar from 'components/DragBar';
import { getRollerbarWidth, settingsSetRollerbarWidth } from 'reducers/settings';

import './RollerBar.scss';

const RollerBar = () => {
  const width = useSelector(getRollerbarWidth);
  const [currentWidth, setCurrentWidth] = useState(width);
  const dispatch = useDispatch();

  const onResize = (width) => {
    dispatch(settingsSetRollerbarWidth(width))
  };

  return (
    <div className="roller-bar" style={{ width: currentWidth }}>
      <DragBar
        onDragEnd={((w) => () => onResize(w))(currentWidth)}
        onDrag={(clientX) => setCurrentWidth(window.innerWidth - clientX)} />
      <div className="roller-bar-content">
        <Roller />
        <RollerOutput />
      </div>
    </div>
  )
};

export default RollerBar;