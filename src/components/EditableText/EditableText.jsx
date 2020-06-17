import React from 'react';
import Input from 'components/Input';

const EditableText = ({ className, text, isEditable=false, onChange=()=>{}, onUnfocus=()=>{}, onClick=()=>{} }) => {
  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onUnfocus(event);
    }
  }

  if (isEditable) {
    return <Input autoFocus value={text} onChange={onChange} onBlur={onUnfocus} onKeyDown={onKeyDown} />
  }

  return (
    <span className={className} onClick={onClick}>
      {text}
    </span>
  );
};

export default EditableText;
