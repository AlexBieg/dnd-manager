import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  get,
  debounce,
} from 'lodash';
import { arrayMove } from 'react-sortable-hoc';
import {
  MultiGrid,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized';
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
import MultiMediaInput from 'components/MultiMediaInput';
import ManagedEditableText from 'components/ManagedEditableText';
import Icon from 'components/Icon';
import Input from 'components/Input';
import Popover from 'components/Popover';

import 'react-virtualized/styles.css'
import './VirtualizedTable.scss';


const HeaderCell = ({
  style,
  value,
  onChangeColWidth,
  onChangeFilters,
  filterValue='',
  onDeleteColumn,
  deleteable,
  onChangeColumnName,
  onColumnDragStart,
  onColumnDragEnd,
  columnIndex
}) => {
  const [dragStart, setDragStart] = useState(null);

  return (
    <div
      index={columnIndex}
      style={style}
      className="v-header-cell"
      onDrop={e => onColumnDragEnd(e.target.getAttribute('index'))}
      onDragOver={e => e.preventDefault()}
    >
      <ManagedEditableText index={columnIndex} text={value} className="v-header-text" onChange={(e) => onChangeColumnName(e.target.value)} />
      {
        deleteable &&
        <Icon
          index={columnIndex}
          icon="trash"
          onClick={onDeleteColumn}
        />
      }
      <Icon
        index={columnIndex}
        icon="arrows-alt-h"
        draggable
        onDragStart={(e) => onColumnDragStart(e.target.getAttribute('index'))}
      />
      <Icon
        index={columnIndex}
        className="v-header-grip"
        draggable
        icon="grip-lines-vertical"
        onDragStart={e => setDragStart(e.clientX)}
        onDragEnd={e => onChangeColWidth(e.clientX - dragStart)}
      />
      <Input
        index={columnIndex}
        className="v-table-filter"
        placeholder="Filter..."
        value={filterValue}
        onChange={e => onChangeFilters(e.target.value)} />
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
}) => {
  const debouncedOnChange = debounce(onChange, 300);
  return (
    <div
      {...(showDrag ? { id: `drag-${index}`} : {})}
      index={index}
      style={style}
      className={"v-data-cell"}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      { showDrag && <Icon index={index} icon="grip-lines" draggable onDragStart={onStartDrag} /> }
      {
        hasMenu &&
          <Popover options={[
            { text: 'Delete Row', icon: 'trash-alt', onClick: () => onDeleteRow() },
            { text: 'Add Row Above', icon: 'plus', onClick: () => onAddRow() }
          ]}>
            <Icon index={index} className="menu" icon="ellipsis-v" />
          </Popover>
      }
      <MultiMediaInput
        index={index}
        value={value}
        onChange={(e) => debouncedOnChange(e.target.value)}
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
      cache: new CellMeasurerCache({
        defaultWidth: 150,
        defaultHeight: 100,
        fixedWidth: true,
      })
    }
  }

  onRenderCell = ({ columnIndex, rowIndex, key, style, parent }) => {
    const { table } = this.props;
    const { filteredRecords, filters, cache } = this.state;


    if (rowIndex === 0) {
      return (
        <CellMeasurer
          cache={cache}
          key={key}
          columnIndex={columnIndex}
          parent={parent}
          rowIndex={rowIndex}
        >
          <HeaderCell
            style={{...style }}
            value={table.columns[columnIndex].title}
            onChangeColWidth={this.onChangeColWidth(columnIndex)}
            deleteable={table.idColumn !== table.columns[columnIndex].name}
            onDeleteColumn={this.onDelColumn(columnIndex)}
            onChangeFilters={this.onSetFilters(table.columns[columnIndex].name)}
            filterValue={filters[table.columns[columnIndex].name]}
            onChangeColumnName={this.onChangeColumnName(columnIndex)}
            onColumnDragStart={(index) => this.setState({ columnDragStartIndex: index })}
            onColumnDragEnd={this.onColumnReorder}
            columnIndex={columnIndex}
          />
        </CellMeasurer>
      )
    }

    const recordIndex = rowIndex - 1;


    return (
      <CellMeasurer
        cache={cache}
        key={key}
        columnIndex={columnIndex}
        parent={parent}
        rowIndex={rowIndex}
      >
        <DataCell
          index={recordIndex}
          style={{...style}}
          onChange={this.onEditCell(columnIndex, recordIndex)}
          onDeleteRow={this.onDeleteRow(recordIndex)}
          onAddRow={this.onAddRow(recordIndex)}
          hasMenu={columnIndex === 0}
          showDrag={columnIndex === 0}
          onStartDrag={((i) => (e) => {
            e.dataTransfer.setDragImage(document.getElementById(`drag-${i}`), 0, 0)
            this.setState({ dragStartIndex: e.target.getAttribute('index')})
          })(recordIndex)}
          onDrop={(e) => this.onRowReorder(e.target.getAttribute('index'))}
          value={filteredRecords[rowIndex - 1][table.columns[columnIndex].name]} />
      </CellMeasurer>
    )
  }

  onColumnReorder = (columnDragEndIndex) => {
    const { table, id, editCols } = this.props;
    const { columnDragStartIndex } = this.state;

    if (columnDragStartIndex) {
      editCols(id, arrayMove(table.columns, columnDragStartIndex, columnDragEndIndex));
      this.setState({ columnDragStartIndex: null });
    }
  }

  onRowReorder = (dragEndIndex) => {
    const { table, orderRows, id } = this.props;
    const { dragStartIndex } = this.state;

    if (dragStartIndex) {
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

  onSetFilters = (columnName) => (term) => {
    const { filters } = this.state;
    const newFilters = {
      ...filters,
      [columnName]: term,
    };

    this.setState({
      filters: newFilters
    })
  }

  componentDidUpdate(prevProps, prevState) {
    const { id, table, records } = this.props;
    const { filters, cache } = this.state;
    const prevWidth = prevProps.table.columns.reduce((acc, c) => acc + c.width, 0);
    const newWidth = table.columns.reduce((acc, c) => acc + c.width, 0);

    if (prevWidth !== newWidth) {
      cache.clearAll();
      this.forceUpdate();
    }

    if (filters !== prevState.filters || records !== prevProps.records) {
      const filteredRecords = records.filter((r) => Object.entries(filters).every(([cName, term]) => get(r, cName, '').toLowerCase().includes(term.toLowerCase())));
      this.setState({ filteredRecords });
    }

    if (id !== prevProps.id) {
      this.setState({
        filters: [],
        filteredRecords: records,
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

  render() {
    const { table } = this.props;
    const { filteredRecords, cache } = this.state;

    cache.clearAll();

    // add a record for the header row
    const totalRecords = [{}, ...filteredRecords];

    return (
      <div className="v-table">
        <div className="v-table-header">
          <ManagedEditableText text={table.name} onChange={(e) => this.onChangeTableName(e.target.value)} />
          <Icon icon="plus" onClick={this.onAddRow(0)} />
          <Icon icon="columns" onClick={this.onAddColumn} />
        </div>
        <AutoSizer>
          {
            ({ width, height }) => (
              <MultiGrid
                useDragHandle
                headerHeight={30}
                height={height}
                width={width}
                fixedRowCount={1}
                rowCount={totalRecords.length}
                rowHeight={({index}) => cache.rowHeight({index}) + (index === 0 ? 10 : 0)}
                columnCount={table.columns.length}
                columnWidth={({ index }) => table.columns[index].width}
                cellRenderer={this.onRenderCell}
              />
            )
          }
        </AutoSizer>
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