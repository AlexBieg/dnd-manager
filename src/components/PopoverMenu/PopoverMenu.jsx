import React from 'react';
import Icon from 'components/Icon';
import './PopoverMenu.scss';

const PopoverMenu = ({ options }) => {
  return (
    <div className="popover-menu">
      { options.map((op, i) => (
        <div className="menu-item" key={i} onClick={op.onClick} onMouseDown={(e) => e.preventDefault()}>
          {op.icon && <Icon className="menu-icon" icon={op.icon} />}
          <span className="menu-text">{op.text}</span>
        </div>
      ))}
    </div>
  );
};

export default PopoverMenu;
