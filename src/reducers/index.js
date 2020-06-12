import { combineReducers } from 'redux';
import rolls from './rolls';

// selectors
export const getObjects = (state) => {
  return state.objects;
}

export const getPages = (state) => {
  return state.pages;
}

const objectsReducer = (state={}, action) => {
  return state;
};

const pagesReducer = (state=[], action) => {
  return state;
}

export default combineReducers({
  objects: objectsReducer,
  pages: pagesReducer,
  rolls,
});