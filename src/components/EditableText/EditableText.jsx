import React from 'react';
import Input from 'components/Input';

const EditableText = ({ className, text, placeholder, isEditable=false, onChange=()=>{}, onBlur=()=>{}, onClick=()=>{} }) => {
  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onBlur(event);
    }
  }

  if (isEditable) {
    return <Input className={className} autoFocus placeholder={placeholder} value={text} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} />
  }

  return (
    <span className={className} onClick={onClick}>
      {text}
    </span>
  );
};

export default EditableText;
