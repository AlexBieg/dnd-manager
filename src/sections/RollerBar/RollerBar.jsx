import React from 'react';
import Roller from 'components/Roller';
import RollerOutput from 'components/RollOutput';

import './RollerBar.scss';

const RollerBar = () => {
  return (
    <div className="roller-bar">
      <Roller />
      <RollerOutput />
    </div>
  )
};

export default RollerBar;