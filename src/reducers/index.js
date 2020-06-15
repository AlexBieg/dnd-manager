import { combineReducers } from 'redux';
import rolls from './rolls';
import pages from './pages';
import tables from './tables';

export default combineReducers({
  pages,
  rolls,
  tables,
});