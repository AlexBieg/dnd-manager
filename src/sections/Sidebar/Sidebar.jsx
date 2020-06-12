import React from 'react';
import { useSelector } from 'react-redux';
import { getPages } from 'reducers';
import './Sidebar.scss';

const Sidebar = () => {
  const pages = useSelector(getPages);

  return (
    <div className="sidebar">
      <div className="header">D&D Manager</div>
      <div className="pages">
        <div className="pages_header">Your Pages</div>
        <div className="pages_list">
          {
            pages.map((p) => (
              <div key={p.name}>{p.name}</div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Sidebar;