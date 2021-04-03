import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit, get } from 'lodash';

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
  (table, records) => get(table, 'rows', []).map(r => records[r])
);

export const getFiltersByTableId = (id) => createSelector(
  getTableById(id),
  (table) => get(table, 'filters', {}),
);

export const getActiveRecord = createSelector(
  getTablesSection,
  (tables) => tables.activeRecord,
);

export const getRecordById = (id) => createSelector(
  getRecords,
  (records) => records[id],
)

export const getFilterableById = (id) => createSelector(
  getTableById(id),
  (table) => get(table, 'filterable', false)
)

export const getCollapsedById = (id) => createSelector(
  getTableById(id),
  (table) => get(table, 'collapsed', false)
)

// Actions
const TABLES_ADD_ROW = 'TABLES_ADD_ROW';
const TABLES_DEL_ROW = 'TABLES_DEL_ROW';
const TABLES_EDIT_ROW = 'TABLES_EDIT_ROW';
const TABLES_ORDER_ROWS = 'TABLES_ORDER_ROWS';

const TABLES_ADD_COL = 'TABLES_ADD_COL';
const TABLES_DEL_COL = 'TABLES_DEL_COL';
const TABLES_EDIT_COL = 'TABLES_EDIT_COL';

const TABLES_EDIT_NAME = 'TABLES_EDIT_NAME';
const TABLES_SET_FILTERS = 'TABLES_SET_FILTERS';
const TABLES_CREATE_TABLE = 'TABLES_CREATE_TABLE';
const TABLES_DELETE_TABLE = 'TABLES_DELETE_TABLE';
const TABLES_IMPORT_TABLE = 'TABLES_IMPORT_TABLE';

const TABLES_SET_ACTIVE_RECORD = 'TABLES_SET_ACTIVE_RECORD';

const TABLES_TOGGLE_FILTERS = 'TABLES_TOGGLE_FILTERS';
const TABLES_COLLAPSE = 'TABLES_COLLAPSE';

// Action Creators
export const tablesSetFilters = (id, filters) => ({
  type: TABLES_SET_FILTERS,
  data: {
    id,
    filters,
  }
})

export const tablesSetActiveRecord = (id) => {
  return {
    type: TABLES_SET_ACTIVE_RECORD,
    data: id,
  }
}

export const tablesImportTable = (data, name, idColumnIndex) => {
  const idColumnId = uuidV4();
  const tableId = uuidV4();

  const columns = data[0].map((c, i) => ({
    name: (i === idColumnIndex ? idColumnId : uuidV4()),
    title: c,
    width: 160,
  }));

  const rows = [];
  const records = {};

  for (let i = 1; i < data.length; i++) {
    const rId = uuidV4();
    rows.push(rId);

    const dataRow = data[i];
    records[rId] = {
      __id: rId,
      __tableId: tableId,
      name: dataRow[idColumnIndex],
      ...dataRow.reduce((acc, colVal, dataIndex) => {
        acc[columns[dataIndex].name] = colVal;
        return acc;
      }, {})
    }
  }

  const table = {
    name,
    idColumn: idColumnId,
    columns,
    rows,
  }

  return {
    type: TABLES_IMPORT_TABLE,
    data: {
      tableId,
      table,
      records,
    },
  }
}

export const tablesOrderRows = (tableId, rows) => {
  return {
    type: TABLES_ORDER_ROWS,
    data: {
      tableId,
      rows,
    }
  }
}
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

export const tableAddRow = (id, index) => {
  return {
    type: TABLES_ADD_ROW,
    data: {
      id,
      index
    },
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

export const tableDelCol = (tableId, colId) => {
  return {
    type: TABLES_DEL_COL,
    data: {
      tableId,
      colId
    },
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

export const tableToggleFilters = (id) => {
  return {
    type: TABLES_TOGGLE_FILTERS,
    data: id,
  }
}

export const tableCollapse = (id) => {
  return {
    type: TABLES_COLLAPSE,
    data: id,
  }
}

// Init State
const INITIAL_STATE = {
  tables: {},
  records: {},
  activeRecord: null,
};

// Reducer
const tables = (state=INITIAL_STATE, { type, data }) => {
  let rows;
  switch (type) {
    case TABLES_COLLAPSE:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data]: {
            ...state.tables[data],
            collapsed: !state.tables[data].collapsed,
          }
        }
      }
    case TABLES_TOGGLE_FILTERS:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data]: {
            ...state.tables[data],
            filterable: !state.tables[data].filterable,
          }
        }
      }
    case TABLES_SET_FILTERS:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data.id]: {
            ...state.tables[data.id],
            filters: { ...data.filters },
          }
        }
      }
    case TABLES_SET_ACTIVE_RECORD:
      return {
        ...state,
        activeRecord: data,
      }
    case TABLES_IMPORT_TABLE:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data.tableId]: data.table,
        },
        records: {
          ...state.records,
          ...data.records,
        }
      }
    case TABLES_ORDER_ROWS:
      return {
        ...state,
        tables: {
          ...state.tables,
          [data.tableId]: {
            ...state.tables[data.tableId],
            rows: [...data.rows],
          }
        }
      };
    case TABLES_DELETE_TABLE:
      rows = state.tables[data].rows;
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
      const newRows = [...state.tables[data.id].rows];
      newRows.splice(data.index, 0, id);

      return {
        ...state,
        records: {
          ...state.records,
          [id]: {
            __id: id,
            __tableId: data.id
          },
        },
        tables: {
          ...state.tables,
          [data.id]: {
            ...(state.tables[data.id]),
            rows: newRows,
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
      const idCol = state.tables[data.tableId].idColumn;
      return {
        ...state,
        records: {
          ...state.records,
          [data.rowId]: {
            ...state.records[data.rowId],
            ...data.rowChanges,
            ...(data.rowChanges[idCol] ? { name: data.rowChanges[idCol] }: {})
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
                width: 80,
              },
            ]
          }
        }
      };
    case TABLES_DEL_COL:
      rows = state.tables[data.tableId].rows;
      const fixedRecords = Object.entries(state.records).reduce((acc, [key, r]) => {
        acc[key] = omit(r, [data.colId]);
        return acc;
      }, {});

      return {
        ...state,
        tables: {
          ...state.tables,
          [data.tableId]: {
            ...(state.tables[data.tableId]),
            columns: [
              ...state.tables[data.tableId].columns.filter(c => c.name !== data.colId),
            ]
          }
        },
        records: {...fixedRecords },
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