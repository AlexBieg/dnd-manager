import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <input type="file" onChange={
          (e) => console.log(e.target.files)
        }/>
      </header>
    </div>
  );
}

export default App;
