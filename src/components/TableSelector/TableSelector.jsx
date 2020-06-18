import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTables, tablesCreateTable, tablesDeleteTable } from 'reducers/tables';
import Button from 'components/Button';
import Input from 'components/Input';
import Icon from 'components/Icon';

import './TableSelector.scss';

const TableSelector = ({ onChange }) => {
  const dispatch = useDispatch();
  const tables = useSelector(getTables);
  const [newTableName, setNewTableName] = useState('');

  const onSelectTable = (id) => () => {
    onChange(id);
  }

  const onCreateTable = (name) => {
    setNewTableName('');
    dispatch(tablesCreateTable(name));
  }

  const onDeleteTable = (id) => () => {
    dispatch(tablesDeleteTable(id));
  }

  return (
    <div className="table-selector">
      <div className="table-selector__cancel">
        <Icon icon="times" onClick={() => onChange(undefined)} />
      </div>
      <div className="table-selector-title">Select a Table</div>
      <div className="available-tables">
        {
          Object.entries(tables).map(([id, table]) => (
            <div className="available-table" key={id}>
              <div className="table-name" onClick={onSelectTable(id)}>{table.name}</div>
              <Icon icon="trash" onClick={onDeleteTable(id)}/>
            </div>
          ))
        }
      </div>
      <div className="add-table">
        <Input value={newTableName} onChange={(e) => setNewTableName(e.target.value)} />
        <Button disabled={newTableName.length === 0} value="Create Table" onClick={() => onCreateTable(newTableName)} />
      </div>
    </div>
  );
};

export default TableSelector;