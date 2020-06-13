import React from 'react';
import Input from 'components/Input';

const EditableText = ({ className, text, isEditable, onChange=()=>{}, onUnfocus=()=>{} }) => {
  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onUnfocus(event);
    }
  }

  if (isEditable) {
    return <Input autoFocus value={text} onChange={onChange} onBlur={onUnfocus} onKeyDown={onKeyDown} />
  }

  return (
    <span className={className}>
      {text}
    </span>
  );
};

export default EditableText;
