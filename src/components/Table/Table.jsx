import React, { useState } from 'react';
import { connect } from 'react-redux';
import { TableCell } from '@material-ui/core';
import {
  SortableContainer,
  SortableHandle,
  SortableElement,
  arrayMove
} from "react-sortable-hoc";
import { findIndex } from 'lodash';
import {
  Grid,
  Table as DXTable,
  TableHeaderRow,
  TableColumnResizing,
  TableInlineCellEditing,
  DragDropProvider,
  TableColumnReordering,
  SearchPanel,
  Toolbar,
  TableEditRow,
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
  TemplateConnector,
  Getter,
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
  tablesOrderRows,
} from 'reducers/tables';
import EditableText from 'components/EditableText';
import ManagedEditableText from 'components/ManagedEditableText';
import MultiMediaInput from 'components/MultiMediaInput';
import Icon from 'components/Icon';

import './Table.scss';

const DragHandle = SortableHandle(() => (
  <span style={{ cursor: "move" }}>{"::::"}</span>
));

const CustomTableEditColumn = ({ onAddColumn }) => (
  <Plugin>
    <Getter
      name="tableColumns"
      computed={({ tableColumns }) => {
        const result = tableColumns.slice();
        result.splice(0, 0, { key: "drag", type: "drag", width: 40 });
        result.splice(0, 0, { key: "delete", type: "delete", width: 40 });
        result.push({ key: "add-col", type: "add-col", width: 40 })
        return result;
      }}
    />
    <Template
      name="tableCell"
      predicate={({ tableColumn, tableRow }) =>
        tableColumn.type === "drag" && tableRow.type === DXTable.ROW_TYPE
      }
    >
      {params => (
        <TemplateConnector>
          {() => (
            <TableCell>
              <DragHandle />
            </TableCell>
          )}
        </TemplateConnector>
      )}
    </Template>
    <Template
      name="tableCell"
      predicate={({ tableColumn, tableRow }) =>
        tableColumn.type === "delete" && tableRow.type === DXTable.ROW_TYPE
      }
    >
      {params => (
        <TemplateConnector>
          {(getters, { deleteRows, commitDeletedRows }) => (
            <TableCell>
              <Icon
                icon="trash"
                onClick={() => {
                  const rowIds = [params.tableRow.rowId];
                  deleteRows({ rowIds });
                  commitDeletedRows({ rowIds });
                }}
                value="Delete"
              />
            </TableCell>
          )}
        </TemplateConnector>
      )}
    </Template>
    <Template
      name="tableCell"
      predicate={({ tableColumn, tableRow }) =>
        tableColumn.type === "delete" &&
        tableRow.type === TableHeaderRow.ROW_TYPE
      }
    >
      {params => (
        <TemplateConnector>
          {(getters, { cancelAddedRows, commitAddedRows, addRow }) => (
            <TableCell>
              <Icon
                icon="plus"
                onClick={() => {
                  addRow();
                  commitAddedRows([0]);
                  cancelAddedRows({ rowIds: [0] });
                }}
                value="Add"
              />
            </TableCell>
          )}
        </TemplateConnector>
      )}
    </Template>
    <Template
      name="tableCell"
      predicate={({ tableColumn, tableRow }) =>
        tableColumn.type === "add-col" &&
        tableRow.type === TableHeaderRow.ROW_TYPE
      }
    >
      {params => (
        <TemplateConnector>
          {() => (
            <TableCell>
              <Icon
                icon="columns"
                onClick={() => {
                  onAddColumn()
                }}
                value="Add"
              />
            </TableCell>
          )}
        </TemplateConnector>
      )}
    </Template>
  </Plugin>
);

const TitleToolbar = ({ name, onChange}) => {
  const [isEditing, setIsEditing] = useState(false);
  return (
    <Plugin name="customToolbarMarkup">
      <Template name="toolbarContent">
        <div className="table-name">
          <EditableText
            isEditable={isEditing || !name}
            text={name}
            placeholder="Table Name..."
            onChange={onChange}
            onClick={() => setIsEditing(true)}
            onUnfocus={() => setIsEditing(false)}
          />
        </div>
      </Template>
    </Plugin>
  );
};

const CellEditorFormatter = ({ value, onValueChange=()=>{}, onBlur=()=>{}, ...rest}) => {
  const [focus, setFocus] = useState(!!onValueChange);
  return (
    <MultiMediaInput
      disabled={!onValueChange}
      focus={focus}
      value={value}
      onBlur={onBlur}
      onFocus={() => setFocus(false)}
      onChange={(e) => {
        onValueChange(e.target.value)
      }} />
  );
}

const CellFormatter = ({ value }) => {
  return (
    <MultiMediaInput disabled value={value} />
  );
}

const CellTypeProvider = props => (
  <DataTypeProvider
    formatterComponent={CellFormatter}
    editorComponent={CellEditorFormatter}
    {...props}
  />
)

const TitleComponent = ({ title, onChange, deletable, onDelete }) => {
  const [newTitle, setNewTitle] = useState(title);

  return (
    <div className="column-header">
      <ManagedEditableText
        text={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        onUnfocus={() => {
          onChange(newTitle)
        }}
      />
      { deletable && <Icon icon="trash" className="delete-column" onClick={onDelete} /> }
    </div>

  );
}

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

  onChangeColumnName = (colId) => (newTitle) => {
    const { table, id, editCols } = this.props;
    const newCols = table.columns.map((c) => {
      if (c.name === colId) {
        return {
          ...c,
          title: newTitle,
        }
      }
      return {...c};
    });

    editCols(id, newCols);
  }

  onDeleteColumn = (colId) => () => {
    const { delCol, id } = this.props;
    delCol(id, colId);
  }

  onEditRow = (changes) => {
    const { id, editRow } = this.props;
    const rowId = Object.keys(changes)[0];

    if (changes[rowId]) {
      editRow(id, rowId, changes[rowId]);
    }
  }

  onCommitRows = ({ deleted, added, changed}) => {
    if (deleted) {
      this.onDeleteRow(deleted);
    }

    if (added) {
      this.onAddRow();
    }

    if (changed) {
      this.onEditRow(changed);
    }
  }

  onAddRow = () => {
    const { addRow, id } = this.props;

    addRow(id);
  }

  onDeleteRow = (deleted) => {
    const { delRow, id } = this.props;

    delRow(id, deleted[0]);
  }

  onAddColumn = () => {
    const { addCol, id } = this.props;

    addCol(id);
  }

  onReorderRows = ({ oldIndex, newIndex }) => {
    const { id, table, reorderRows } = this.props
    reorderRows(id, arrayMove(table.rows, oldIndex, newIndex));
  }

  render() {
    const {
      id,
      table,
      rows,
      editName,
    } = this.props;
    const {
      searchTerm,
    } = this.state;

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
        <Grid
          rows={rows}
          columns={table.columns}
          getRowId={(row) => row.__id}
        >
          <DragDropProvider />
          <CellTypeProvider for={table.columns.map(c => c.name)} />
          <EditingState
            onCommitChanges={(diff) => this.onCommitRows(diff)}
          />
          <SearchState value={searchTerm} onValueChange={term => this.setState({ searchTerm: term })} />
          <IntegratedFiltering />
          <DXTable
            title="test title"
            height={400}
            bodyComponent={({ row, ...restProps }) => {
              const TableBody = SortableContainer(DXTable.TableBody);
              return (
                <TableBody {...restProps} onSortEnd={this.onReorderRows} useDragHandle />
              );
            }}
            rowComponent={({ row, ...restProps }) => {
              const TableRow = SortableElement(DXTable.Row);
              return <TableRow {...restProps} index={findIndex(table.rows, (r) => r === row.__id)} />;
            }}
            columnExtensions={columnExtensions} />
          <TableColumnResizing
            columnWidths={columnWidths}
            onColumnWidthsChange={this.onChangeWidth}
          />
          <TableHeaderRow contentComponent={({ column }) => {
            return (
              <TitleComponent
                title={column.title}
                deletable={column.name !== table.idColumn}
                onDelete={this.onDeleteColumn(column.name)}
                onChange={this.onChangeColumnName(column.name)} />
            );
          }} />
          <TableColumnReordering
            order={table.columns.map(c => c.name)}
            onOrderChange={this.onReorderColumns}
          />
          <Toolbar />
          <SearchPanel />
          <TitleToolbar name={table.name} onChange={(e) => editName(id, e.target.value)}/>
          <CustomTableEditColumn onAddColumn={this.onAddColumn}/>
          <TableEditRow />
          <TableInlineCellEditing />
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
  reorderRows: tablesOrderRows,
  delCol: tableDelCol,
  addRow: tableAddRow,
  addCol: tableAddCol,
  editCols: tableEditCols,
  editName: tableEditName,
};


export default connect(mapStateToProps, mapDispatchToProps)(Table);