import React, { useState } from 'react';
import TinyPopover from 'react-tiny-popover';
import PopoverMenu from 'components/PopoverMenu';

const Popover = ({ options, children, ...props }) => {
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  return (
    <TinyPopover
      isOpen={menuIsOpen}
      position={'bottom'} // preferred position
      content={() => {
        return <PopoverMenu options={options.map(o => ({
          ...o,
          onClick: (e) => {
            setMenuIsOpen(false);
            o.onClick(e);
          }
        }))} />
      }}
      onClickOutside={() => setMenuIsOpen(false)}
      {...props}
      >
      <div onClick={() => setMenuIsOpen(true)} {...props}>
        {children}
      </div>
    </TinyPopover>
  );
}

export default Popover;