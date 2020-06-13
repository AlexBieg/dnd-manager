import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import './App.scss';
import './index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';
import baseReducer from './reducers';
const electron = window.require('electron');
const ipcRenderer  = electron.ipcRenderer;

// User data saving middleware
const saver = store => next => action => {
  let result = next(action)
  ipcRenderer.send('save-user-data', JSON.stringify(store.getState()));
  return result
}

ipcRenderer.on('user-data', (e, data) => {
  const store = createStore(
    baseReducer,
    JSON.parse(data),
    applyMiddleware(logger, saver),
  );

  window.store = store;

  ReactDOM.render(
    <Provider store={store}>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </Provider>,
    document.getElementById('root')
  );
});

ipcRenderer.send('load-user-data', true);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
