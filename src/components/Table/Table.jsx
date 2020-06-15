import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ReactDataGrid from "react-data-grid";
import fuzzysort from 'fuzzysort';
import { getTableById, tableAddRow, tableDelRow, tableEditRow, tableAddCol, tableDelCol } from 'reducers/tables';
import Input from 'components/Input';
import Icon from 'components/Icon';

import 'react-data-grid/dist/react-data-grid.css';
import './Table.scss';

const Table = ({ id }) => {
  const dispatch = useDispatch();
  const table = useSelector(getTableById(id));
  const [searchTerm, setSearchTerm] = useState('');

  if (id === 'select') {
    return <div>Table Selector</div>
  }

  const onUpdateRow = ({ fromRow, toRow, cellKey, updated}) => {
    if (fromRow === toRow) {
      dispatch(tableEditRow(id, fromRow, {
        ...table.rows[fromRow],
        ...updated,
      }))
    }
  }

  let searchedRows = []
  if (searchTerm.length) {
    const keys = table.columns.map(c => c.key);
    const results = fuzzysort.go(searchTerm, table.rows, { keys })
    console.log(results);

    searchedRows = results.map(r => r.obj);
  }


  return (
    <div className="table">
      <Icon icon="plus" onClick={() => dispatch(tableAddRow(id)) } />
      <Icon icon="columns" onClick={() => dispatch(tableAddCol(id)) } />
      <Input placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
      <ReactDataGrid
        columns={table.columns}
        rows={searchedRows.length ? searchedRows : table.rows}
        onRowsUpdate={onUpdateRow}
      />
      <Icon icon="plus" onClick={() => dispatch(tableDelRow(id)) } />
      <Icon icon="columns" onClick={() => dispatch(tableDelCol(id)) } />
    </div>
  );
}

export default Table;