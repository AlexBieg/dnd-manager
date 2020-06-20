import React from 'react';
import Input from 'components/Input';

const EditableText = ({ className, text, placeholder, isEditable=false, onChange=()=>{}, onBlur=()=>{}, onClick=()=>{}, ...restProps }) => {
  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      onBlur(event);
    }
  }

  if (isEditable) {
    return <Input {...restProps} className={className} autoFocus placeholder={placeholder} value={text} onChange={onChange} onBlur={onBlur} onKeyDown={onKeyDown} />
  }

  return (
    <span {...restProps} className={className} onClick={onClick}>
      {text}
    </span>
  );
};

export default EditableText;
