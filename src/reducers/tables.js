import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit } from 'lodash';

// Selectors
export const getTablesSection = (state) => state.tables;
export const getTables = createSelector(
  getTablesSection,
  (tablesSect) => tablesSect.tables,
)
export const getRecords = createSelector(
  getTablesSection,
  (tablesSect) => tablesSect.records,
)

export const getTableById = (id) => createSelector(
  getTables,
  (tables) => tables[id],
);

export const getRecordsByTableId = (id) => createSelector(
  getTableById(id),
  getRecords,
  (table, records) => table.rows.map(r => records[r])
)

// Actions
const TABLES_ADD_ROW = 'TABLES_ADD_ROW';
const TABLES_DEL_ROW = 'TABLES_DEL_ROW';
const TABLES_EDIT_ROW = 'TABLES_EDIT_ROW';

const TABLES_ADD_COL = 'TABLES_ADD_COL';
const TABLES_DEL_COL = 'TABLES_DEL_COL';
const TABLES_EDIT_COL = 'TABLES_EDIT_COL';

const TABLES_EDIT_NAME = 'TABLES_EDIT_NAME';
const TABLES_CREATE_TABLE = 'TABLES_CREATE_TABLE';
const TABLES_DELETE_TABLE = 'TABLES_DELETE_TABLE';

// Action Creators
export const tablesDeleteTable = (id) => {
  return {
    type: TABLES_DELETE_TABLE,
    data: id,
  }
}

export const tablesCreateTable = (name) => {
  return {
    type: TABLES_CREATE_TABLE,
    data: name,
  }
};

export const tableEditName = (id, name) => {
  return {
    type: TABLES_EDIT_NAME,
    data: {
      id,
      name,
    }
  }
};

export const tableAddRow = (id) => {
  return {
    type: TABLES_ADD_ROW,
    data: id,
  }
};

export const tableDelRow = (tableId, rowId) => {
  return {
    type: TABLES_DEL_ROW,
    data: {
      tableId,
      rowId
    },
  }
};

export const tableEditRow = (tableId, rowId, rowChanges) => {
  return {
    type: TABLES_EDIT_ROW,
    data: {
      tableId,
      rowId,
      rowChanges,
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

export const tableEditCols = (id, cols) => {
  return {
    type: TABLES_EDIT_COL,
    data: {
      id,
      cols,
    }
  }
}

// Init State
const INITIAL_STATE = {
  tables: {},
  records: {},
};

// Reducer
const tables = (state=INITIAL_STATE, { type, data }) => {
  switch (type) {
    case TABLES_DELETE_TABLE:
      const rows = state.tables[data].rows;
      return {
        ...state,
        tables: omit(state.tables, [data]),
        records: omit(state.records, rows),
      };
    case TABLES_CREATE_TABLE:
      const idColId = uuidV4();
      return {
        ...state,
        tables: {
          ...state.tables,
          [uuidV4()]: {
            name: data,
            idColumn: idColId,
            rows: [],
            columns: [
              {name: idColId, title: "Name", width: 80}
            ]
          }
        }
      }
    case TABLES_EDIT_NAME:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data.id]: {
            ...state.tables[data.id],
            name: data.name,
          }
        }
      };
    case TABLES_ADD_ROW:
      const id = uuidV4();
      return {
        ...state,
        records: {
          ...state.records,
          [id]: { __id: id },
        },
        tables: {
          ...state.tables,
          [data]: {
            ...(state.tables[data]),
            rows: [
              ...state.tables[data].rows,
              id,
            ]
          }
        }
      };
    case TABLES_DEL_ROW:
      const newState = {
        ...state,
        tables: {
          ...state.tables,
          [data.tableId]: {
            ...state.tables[data.tableId],
            rows: [...state.tables[data.tableId].rows.filter(r => r !== data.rowId)]
          }
        }
      };

      delete newState.records[data.rowId];

      return newState;
    case TABLES_EDIT_ROW:
      const idCol = state.tables[data.tableId].columns[0];
      return {
        ...state,
        records: {
          ...state.records,
          [data.rowId]: {
            ...state.records[data.rowId],
            ...data.rowChanges,
            ...(data.rowChanges[idCol.name] ? { name: data.rowChanges[idCol.name] }: {})
          },
        }
      };
    case TABLES_ADD_COL:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data]: {
            ...(state.tables[data]),
            columns: [
              ...state.tables[data].columns,
              {
                name: uuidV4(),
                title: 'Column',
              },
            ]
          }
        }
      };
    case TABLES_DEL_COL:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data]: {
            ...(state.tables[data]),
            columns: [
              ...state[data].columns.slice(0, -1),
            ]
          }
        }
      };
    case TABLES_EDIT_COL:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data.id]: {
            ...state.tables[data.id],
            columns: [...data.cols],
          }
        }
      }
    default:
      return state;
  }
};

export default tables;