import React from 'react';

import './DragBar.scss';

const DragBar = ({
  onDragStart = () => {},
  onDrag = () => {},
  onDragEnd = () => {}
}) => {
  return (
    <div className="drag-bar"
      draggable
      onDragStart={(e) => {
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(img, 0, 0);
        onDragStart(e);
      }}
      onDragEnd={onDragEnd}
      onDrag={({ clientX }) => {
        if (clientX > 0) {
          onDrag(clientX);
        }
      }}
    />
  )
};

export default DragBar;