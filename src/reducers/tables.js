import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';

// Selectors
export const getTables = (state) => state.tables;
export const getTableById = (id) => createSelector(
  getTables,
  (tables) => tables[id],
);

// Actions
const TABLES_ADD_ROW = 'TABLES_ADD_ROW';
const TABLES_DEL_ROW = 'TABLES_DEL_ROW';
const TABLES_EDIT_ROW = 'TABLES_EDIT_ROW';

const TABLES_ADD_COL = 'TABLES_ADD_COL';
const TABLES_DEL_COL = 'TABLES_DEL_COL';

// Action Creators
export const tableAddRow = (id) => {
  return {
    type: TABLES_ADD_ROW,
    data: id,
  }
};

export const tableDelRow = (id) => {
  return {
    type: TABLES_DEL_ROW,
    data: id,
  }
};

export const tableEditRow = (id, index, row) => {
  return {
    type: TABLES_EDIT_ROW,
    data: {
      id,
      index,
      row,
    }
  }
}

export const tableAddCol = (id) => {
  return {
    type: TABLES_ADD_COL,
    data: id,
  }
};

export const tableDelCol = (id) => {
  return {
    type: TABLES_DEL_COL,
    data: id,
  }
};

const INITIAL_STATE = {};

// Reducer
const tables = (state=INITIAL_STATE, { type, data }) => {
  switch (type) {
    case TABLES_ADD_ROW:
      return {
        ...state,
        [data]: {
          ...(state[data]),
          rows: [
            ...state[data].rows,
            {},
          ]
        }
      };
    case TABLES_DEL_ROW:
      return {
        ...state,
        [data]: {
          ...(state[data]),
          rows: [
            ...state[data].rows.slice(0, -1),
          ]
        }
      };
    case TABLES_EDIT_ROW:
      const newRows = [...state[data.id].rows];
      newRows[data.index] = data.row;
      return {
        ...state,
        [data.id]: {
          ...(state[data.id]),
          rows: [ ...newRows ],
        },
      };
    case TABLES_ADD_COL:
      return {
        ...state,
        [data]: {
          ...(state[data]),
          columns: [
            ...state[data].columns,
            {
              key: uuidV4(),
              name: 'Column',
              draggable: true,
              editable: true,
              sortable: true,
              resizeable: true,
            },
          ]
        }
      };
    case TABLES_DEL_COL:
      return {
        ...state,
        [data]: {
          ...(state[data]),
          columns: [
            ...state[data].columns.slice(0, -1),
          ]
        }
      };
    default:
      return state;
  }
};

export default tables;