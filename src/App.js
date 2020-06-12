import React from 'react';
import Sidebar from 'sections/Sidebar';
import RollerBar from 'sections/RollerBar';
import './App.scss';

function App() {
  return (
    <div className="App">
      <Sidebar />
      <div className="main" style={{ width: '100%', position: 'relative' }}>
        <div>here is content</div>
        <RollerBar />
      </div>
    </div>
  );
}

export default App;
