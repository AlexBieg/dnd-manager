import React from 'react';
import classNames from 'classnames';
import Icon from 'components/Icon';
import Popover from 'components/Popover';

const Callout = ({ color, attributes, children, onChangeColor }) => (
  <div className={classNames('callout', color || 'gray')} {...attributes}>
    <Popover
      className="lightbulb-popover"
      options={[
        { text: 'Gray', onClick: () => onChangeColor('gray')},
        { text: 'Blue', onClick: () => onChangeColor('blue') },
        { text: 'Red', onClick: () => onChangeColor('red') },
        { text: 'Orange', onClick: () => onChangeColor('orange') },
        { text: 'Green', onClick: () => onChangeColor('green') },
        { text: 'Yellow', onClick: () => onChangeColor('yellow') },
      ]}
      style={{ userSelect: "none" }}
      contentEditable={false}
    >
      <Icon
        icon="lightbulb"
        className="lightbulb" />
    </Popover>
    {children}
  </div>
);

export default Callout;