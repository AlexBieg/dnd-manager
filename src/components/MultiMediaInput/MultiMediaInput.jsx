import React from 'react';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';

import './MultiMediaInput.scss';

const MultiMediaInput = ({
  children,
  className,
  onChange=()=>{},
  onKeyDown=()=>{},
  onFocus=()=>{},
  onBlur=()=>{},
  ...props
}) => {
  const onKeyDownInner = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
    }
    onKeyDown(event);
  }

  return (
    <TextareaAutosize
      {...props}
      className={classNames('multimedia-input', className)}
      onKeyDown={onKeyDownInner}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      value={children}
    />
  );
};

export default MultiMediaInput;