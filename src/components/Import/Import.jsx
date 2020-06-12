import React from 'react';
import { useSelector } from 'react-redux';
import { getObjects } from 'reducers';

const Import = () => {
  const objects = useSelector(getObjects);
  return (
    <div>
      <div>My Import</div>
      <div>Objects</div>
      <div>{Object.keys(objects).length}</div>
    </div>
  );
};

export default Import;
