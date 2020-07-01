import { combineReducers } from 'redux';
import rolls from './rolls';
import pages from './pages';
import tables from './tables';
import settings from './settings';

export default combineReducers({
  pages,
  rolls,
  tables,
  settings,
});