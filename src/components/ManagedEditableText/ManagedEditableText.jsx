import React, { useState } from 'react';
import EditableText from 'components/EditableText';

const ManagedEditableText = ({ onBlur=()=>{}, ...props}) => {
  const [isEditing, setIsEditing] = useState(!props.text);
  return (
    <EditableText
      { ...props }
      isEditable={isEditing}
      onClick={() => setIsEditing(true)}
      onBlur={() => {
        setIsEditing(false);
        onBlur();
      }}
    />
  )
};

export default ManagedEditableText;
