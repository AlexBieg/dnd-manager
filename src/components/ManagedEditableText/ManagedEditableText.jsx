import React, { useState } from 'react';
import EditableText from 'components/EditableText';

const ManagedEditableText = (props) => {
  const [isEditing, setIsEditing] = useState(!props.text);
  return (
    <EditableText
      { ...props }
      isEditable={isEditing}
      onClick={() => setIsEditing(true)}
      onUnfocus={() => setIsEditing(false)}
    />
  )
};

export default ManagedEditableText;
