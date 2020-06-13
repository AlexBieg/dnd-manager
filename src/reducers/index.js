import { combineReducers } from 'redux';
import rolls from './rolls';
import pages from './pages';

const objectsReducer = (state={}, action) => {
  return state;
};

export default combineReducers({
  objects: objectsReducer,
  pages,
  rolls,
});