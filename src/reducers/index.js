import { combineReducers } from 'redux';

const objectsReducer = (state={}, action) => {
  return state;
};

const pagesReducer = (state=[], action) => {
  return state;
}

export default combineReducers({
  objects: objectsReducer,
  pages: pagesReducer,
});