import React from 'react';
import Sidebar from 'sections/Sidebar';
import RollerBar from 'sections/RollerBar';
import Page from 'sections/Page';
import './App.scss';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="main">
        <Page />
        <RollerBar />
      </div>
    </div>
  );
}

export default App;
