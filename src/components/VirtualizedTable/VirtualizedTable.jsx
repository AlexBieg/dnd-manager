import React, { useState } from 'react';
import { connect } from 'react-redux';
import { arrayMove } from 'react-sortable-hoc';
import { debounce } from 'lodash';
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
import { Node } from 'slate'
import Editor from 'components/Editor';
import ManagedEditableText from 'components/ManagedEditableText';
import Icon from 'components/Icon';
import Input from 'components/Input';
import Popover from 'components/Popover';

import 'react-virtualized/styles.css'
import './VirtualizedTable.scss';


const HeaderCell = ({
  value,
  onChangeColWidth,
  onChangeFilters,
  filterValue='',
  onDeleteColumn,
  deleteable,
  onChangeColumnName,
  onColumnDragStart,
  onColumnDragEnd,
  columnName,
}) => {
  const [dragStart, setDragStart] = useState(null);
  const [filterTerm, setFilterTerm] = useState(filterValue);
  const debouncedOnChangeFilters = debounce(onChangeFilters, 300);

  return (
    <div
      className="v-header-cell"
      onDrop={onColumnDragEnd}
      onDragOver={e => e.preventDefault()}
      id={`drag-column-${columnName}`}
    >
      <ManagedEditableText text={value} className="v-header-text" onChange={(e) => onChangeColumnName(e.target.value)} />
      {
        deleteable &&
        <Icon
          icon="trash"
          onClick={onDeleteColumn}
        />
      }
      <Icon
        icon="arrows-alt-h"
        draggable
        onDragStart={onColumnDragStart}
      />
      <Icon
        className="v-header-grip"
        draggable
        icon="grip-lines-vertical"
        onDragStart={e => setDragStart(e.clientX)}
        onDragEnd={e => onChangeColWidth(e.clientX - dragStart)}
      />
      <Input
        className="v-table-filter"
        placeholder="Filter..."
        value={filterTerm}
        onChange={e => {
          const val = e.target.value || '';
          setFilterTerm(val);
          debouncedOnChangeFilters(val);
        }} />
    </div>
  );
}

const DataCell = ({
  style,
  value,
  onChange,
  onDeleteRow,
  onAddRow,
  hasMenu=false,
  index,
  showDrag,
  onStartDrag,
  onDrop,
  columnName,
}) => {
  const [innerVal, setInnerVal] = useState(value);

  const onChangeInner = (val) => {
    setInnerVal(val);
  }

  return (
    <div
      {...(showDrag ? { id: `drag-${index}-${columnName}`} : {})}
      index={index}
      style={style}
      className={"v-data-cell"}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      { showDrag && <Icon icon="grip-lines" draggable onDragStart={onStartDrag} /> }
      {
        hasMenu &&
          <Popover options={[
            { text: 'Delete Row', icon: 'trash-alt', onClick: () => onDeleteRow() },
            { text: 'Add Row Above', icon: 'plus', onClick: () => onAddRow() }
          ]}>
            <Icon className="menu" icon="ellipsis-v" />
          </Popover>
      }
      <Editor
        value={innerVal}
        onChange={onChangeInner}
        onBlur={() => onChange(innerVal)}
      />
    </div>
  );
}

class VirtualizedTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: {},
      filteredRecords: props.records,
      dragStartIndex: null,
      columnDragStartIndex: null,
      showCount: 10,
    }
  }

  onColumnReorder = (columnDragEndIndex) => () => {
    const { table, id, editCols } = this.props;
    const { columnDragStartIndex } = this.state;

    if (columnDragStartIndex !== null) {
      editCols(id, arrayMove(table.columns, columnDragStartIndex, columnDragEndIndex));
      this.setState({ columnDragStartIndex: null });
    }
  }

  onRowReorder = (dragEndIndex) => () => {
    const { table, orderRows, id } = this.props;
    const { dragStartIndex } = this.state;

    if (dragStartIndex !== null) {
      orderRows(id, arrayMove(table.rows, dragStartIndex, dragEndIndex));
      this.setState({ dragStartIndex: null })
    }
  }

  onDeleteRow = (rowIndex) => () => {
    const { table, id, delRow } = this.props;

    delRow(id, table.rows[rowIndex]);
  }

  onAddRow = (index=0) => () => {
    const { id, addRow } = this.props;
    addRow(id, index)
  }

  onChangeColumnName = (columnIndex) => (newName) => {
    const { table, id, editCols } = this.props;

    const newCols = table.columns.map((c, i) => {
      if (i !== columnIndex) {
        return c;
      }

      return {
        ...c,
        title: newName,
      }
    });

    editCols(id, newCols);
  }

  onChangeColWidth = (columnIndex) => (diff) => {
    const { table, id, editCols } = this.props;

    const newCols = table.columns.map((c, i) => {
      if (i !== columnIndex) {
        return c;
      }

      return {
        ...c,
        width: Math.max(c.width + diff, 80),
      }
    });

    editCols(id, newCols);
  }

  onEditCell = (columnIndex, rowIndex) => (value) => {
    const { editRow, id, table } = this.props;
    const { filteredRecords } = this.state;
    const rowChanges = {
      [table.columns[columnIndex].name]: value,
    }

    editRow(id, filteredRecords[rowIndex].__id, rowChanges)
  }

  getFilteredRecordsFromFilters = (records, filters) => {
    return records.filter((r) => {
      return Object.entries(filters).every(([cName, term]) => {
        let text;
        if (typeof r[cName] === 'object') {
          text = r[cName].map(n => Node.string(n))[0];
        } else {
          text = r[cName];
        }
        return (text || '').toLowerCase().includes(term.toLowerCase());
      });
    });
  }

  onSetFilters = (columnName) => (term='') => {
    const { records } = this.props;
    const { filters } = this.state;
    const newFilters = {
      ...filters,
      [columnName]: term,
    };

    const filteredRecords = this.getFilteredRecordsFromFilters(records, newFilters);

    this.setState({
      filters: newFilters,
      filteredRecords,
      showCount: 10,
    })
  }

  componentDidUpdate(prevProps) {
    const { records } = this.props;
    const { filters } = this.state;

    if (records !== prevProps.records) {
      this.setState({
        filteredRecords: this.getFilteredRecordsFromFilters(records, filters),
      })
    }
  }

  onAddColumn = () => {
    const { id, addCol } = this.props;
    addCol(id);
  }

  onDelColumn = (colIndex) => () => {
    const { delCol, id, table } = this.props;

    delCol(id, table.columns[colIndex].name);
  }

  onChangeTableName = (newName) => {
    const { id, editName } = this.props;

    editName(id, newName);
  }

  handleScroll = (e) => {
    const { filteredRecords, showCount } = this.state;
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;


    if (bottom && showCount <= filteredRecords.length) {
      this.setState({
        showCount: showCount + 10,
      })
    }
  }

  render() {
    const { table } = this.props;
    const { filteredRecords, outerHeight, showCount, filters } = this.state;

    if (!table) {
      return <div>The selected table does not exist</div>
    }

    return (
      <div className="v-table" style={{ height: outerHeight }}>
        <div className="v-table-header">
          <ManagedEditableText text={table.name} onChange={(e) => this.onChangeTableName(e.target.value)} />
          <Icon icon="plus" onClick={this.onAddRow(0)} />
          <Icon icon="columns" onClick={this.onAddColumn} />
        </div>
        <div className="v-table-grid" onScroll={this.handleScroll}>
          <table cellSpacing="0" cellPadding="0">
            <thead>
              <tr>
                {
                  table.columns.map((c, columnIndex) => (
                    <th style={{ minWidth: c.width }} key={c.name}>
                      <HeaderCell
                        value={c.title}
                        onChangeColWidth={this.onChangeColWidth(columnIndex)}
                        deleteable={table.idColumn !== table.columns[columnIndex].name}
                        onDeleteColumn={this.onDelColumn(columnIndex)}
                        onChangeFilters={this.onSetFilters(table.columns[columnIndex].name)}
                        filterValue={filters[table.columns[columnIndex].name]}
                        onChangeColumnName={this.onChangeColumnName(columnIndex)}
                        columnName={table.columns[columnIndex].name}
                        onColumnDragStart={((index, cName) => (e) => {
                          e.dataTransfer.setDragImage(document.getElementById(`drag-column-${cName}`), 0, 0)
                          this.setState({ columnDragStartIndex: index });
                        })(columnIndex, table.columns[columnIndex].name)}
                        onColumnDragEnd={this.onColumnReorder(columnIndex)}
                        columnIndex={columnIndex}
                      />
                    </th>
                  ))
                }
              </tr>
            </thead>
            <tbody>
              {
              filteredRecords.slice(0, showCount).map((r, recordIndex) => (
                  <tr key={r.__id}>
                    {
                      table.columns.map((c, columnIndex) => (
                        <td key={`${c.name}-${r.__id}`}>
                          <DataCell
                            index={recordIndex}
                            onChange={this.onEditCell(columnIndex, recordIndex)}
                            onDeleteRow={this.onDeleteRow(recordIndex)}
                            onAddRow={this.onAddRow(recordIndex)}
                            hasMenu={columnIndex === 0}
                            showDrag={columnIndex === 0}
                            columnName={table.columns[columnIndex].name}
                            onStartDrag={((i, cName) => (e) => {
                              e.dataTransfer.setDragImage(document.getElementById(`drag-${i}-${cName}`), 0, 0)
                              this.setState({ dragStartIndex: i})
                            })(recordIndex, table.columns[columnIndex].name)}
                            onDrop={this.onRowReorder(recordIndex)}
                            value={filteredRecords[recordIndex][table.columns[columnIndex].name]} />
                        </td>
                      ))
                    }
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  table: getTableById(props.id)(state),
  records: getRecordsByTableId(props.id)(state)
});

const mapDispatchToProps = {
  editRow: tableEditRow,
  delRow: tableDelRow,
  editCols: tableEditCols,
  addRow: tableAddRow,
  addCol: tableAddCol,
  delCol: tableDelCol,
  editName: tableEditName,
  orderRows: tablesOrderRows,
}

export default connect(mapStateToProps, mapDispatchToProps)(VirtualizedTable);