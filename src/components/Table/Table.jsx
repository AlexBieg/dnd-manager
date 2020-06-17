import React, { useState } from 'react';
import { connect } from 'react-redux';
import fuzzysort from 'fuzzysort';
import {
  findIndex
} from 'lodash';
import {
  Grid,
  VirtualTable,
  TableHeaderRow,
  TableColumnResizing,
  TableInlineCellEditing,
  DragDropProvider,
  TableColumnReordering,
  SearchPanel,
  Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import {
  EditingState,
  SearchState,
  IntegratedFiltering,
  DataTypeProvider,
} from '@devexpress/dx-react-grid';
import {
  Plugin,
  Template,
  TemplatePlaceholder,
} from '@devexpress/dx-react-core';
import {
  getTableById,
  getRecordsByTableId,
  tableAddRow,
  tableDelRow,
  tableEditRow,
  tableAddCol,
  tableDelCol,
  tableEditCols,
  tableEditName,
} from 'reducers/tables';
import EditableText from 'components/EditableText';
import MultiMediaInput from 'components/MultiMediaInput';
import Icon from 'components/Icon';

import './Table.scss';

const TitleToolbar = ({ name, onChange}) => {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <Plugin name="customToolbarMarkup">
      <Template name="toolbarContent">
        <div className="table-name">
          <EditableText
            isEditable={isEditing}
            text={name}
            onChange={onChange}
            onClick={() => setIsEditing(true)}
            onUnfocus={() => setIsEditing(false)}
          />
        </div>
        <TemplatePlaceholder />
      </Template>
    </Plugin>
  );
};

const CellFormatter = ({ value, onValueChange=()=>{}, onBlur=()=>{} }) => {
  const [shouldFocus, setShouldFocus] = useState(!!onValueChange);
  return (
    <MultiMediaInput
      focus={shouldFocus}
      value={value}
      onBlur={onBlur}
      onFocus={() => setShouldFocus(false)}
      onChange={(e) => onValueChange(e.target.value)} />
  );
}

const CellTypeProvider = props => (
  <DataTypeProvider
    formatterComponent={CellFormatter}
    editorComponent={CellFormatter}
    {...props}
  />
)

class Table extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchTerm: '',
    }
  }

  onChangeWidth = (widths) => {
    const { table, editCols, id } = this.props;

    const changedCols = table.columns.map((c) => {
      const width = widths.find(w => w.columnName === c.name);
      return {
        ...c,
        width: width.width,
      };
    });

    editCols(id, changedCols);
  }

  onReorderColumns = (columnNames) => {
    const { table, editCols, id } = this.props;

    const changedCols = columnNames.map((name) => table.columns.find(c => c.name === name));

    editCols(id, changedCols);
  }

  onEditRow = (rowId, rowChanges) => {
    const { editRow } = this.props;

    editRow(rowId, rowChanges);
  }

  render() {
    const {
      id,
      table,
      rows,
      editName,
      addCol,
      addRow,
      delCol,
      delRow,
    } = this.props;
    const {
      searchTerm,
    } = this.state;

    if (id === 'select') {
      return <div>Table Selector</div>
    }

    const columnExtensions = table.columns.map(c => ({
      columnName: c.name,
      wordWrapEnabled: true,
    }));

    const columnWidths = table.columns.map((c) => ({
      columnName: c.name,
      width: c.width || 80,
    }));

    return (
      <div className="table">
        <div className="table-menu">
          <div className="table-actions">
            <Icon icon="plus" onClick={() => addRow(id) } />
            <Icon icon="columns" onClick={() => addCol(id) } />
          </div>
        </div>
        <Grid
          rows={rows}
          columns={table.columns}
          getRowId={(row) => row.__id}
        >
          <CellTypeProvider for={table.columns.map(c => c.name)} />
          <DragDropProvider />
          <EditingState
            createRowChange={(row, change, column) => this.onEditRow(row.__id, { [column]: change })}
            defaultEditingRowIds={rows.map((_, i) => i)}
          />
          <SearchState value={searchTerm} onValueChange={term => this.setState({ searchTerm: term })} />
          <IntegratedFiltering />
          <VirtualTable
            title="test title"
            height={400}
            columnExtensions={columnExtensions} />
          <TableColumnResizing
            columnWidths={columnWidths}
            onColumnWidthsChange={this.onChangeWidth}
          />
          <TableHeaderRow />
          <TableInlineCellEditing />
          <TableColumnReordering
            order={table.columns.map(c => c.name)}
            onOrderChange={this.onReorderColumns}
          />
          <Toolbar />
          <SearchPanel />
          <TitleToolbar name={table.name} onChange={(e) => editName(id, e.target.value)}/>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = (state, { id }) => ({
  table: getTableById(id)(state),
  rows: getRecordsByTableId(id)(state),
});

const mapDispatchToProps = {
  editRow: tableEditRow,
  delRow: tableDelRow,
  delCol: tableDelCol,
  addRow: tableAddRow,
  addCol: tableAddCol,
  editCols: tableEditCols,
  editName: tableEditName,
};


export default connect(mapStateToProps, mapDispatchToProps)(Table);