import React from 'react';
import { useSelector } from 'react-redux';
import Sidebar from 'sections/Sidebar';
import RollerBar from 'sections/RollerBar';
import Page from 'components/Page';
import { getActivePageId } from 'reducers/pages';
import './App.scss';

function App() {
  const activePageId = useSelector(getActivePageId);

  return (
    <div className="App">
      <Sidebar />
      <div className="main">
        <Page pageId={activePageId}/>
        <RollerBar />
      </div>
    </div>
  );
}

export default App;
