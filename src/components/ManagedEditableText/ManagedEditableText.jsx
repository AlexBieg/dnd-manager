import React, { useState } from 'react';
import EditableText from 'components/EditableText';

const ManagedEditableText = ({ onUnfocus, ...props}) => {
  const [isEditing, setIsEditing] = useState(!props.text);
  return (
    <EditableText
      { ...props }
      isEditable={isEditing}
      onClick={() => setIsEditing(true)}
      onUnfocus={() => {
        setIsEditing(false);
        onUnfocus();
      }}
    />
  )
};

export default ManagedEditableText;
