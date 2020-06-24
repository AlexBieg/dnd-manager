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
import Editor from 'components/Editor';
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
  columnName,
}) => {
  const [dragStart, setDragStart] = useState(null);

  return (
    <div
      style={style}
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
      dragStartIndex: null,
      columnDragStartIndex: null,
      cache: new CellMeasurerCache({
        defaultWidth: 150,
        defaultHeight: 39,
        fixedWidth: true,
      })
    }
  }

  onRenderCell = ({ columnIndex, rowIndex, key, style, parent }) => {
    const { table, records } = this.props;
    const { filters, cache } = this.state;


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
            columnName={table.columns[columnIndex].name}
            onColumnDragStart={((index, cName) => (e) => {
              e.dataTransfer.setDragImage(document.getElementById(`drag-column-${cName}`), 0, 0)
              this.setState({ columnDragStartIndex: index });
            })(columnIndex, table.columns[columnIndex].name)}
            onColumnDragEnd={this.onColumnReorder(columnIndex)}
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
          columnName={table.columns[columnIndex].name}
          onStartDrag={((i, cName) => (e) => {
            e.dataTransfer.setDragImage(document.getElementById(`drag-${i}-${cName}`), 0, 0)
            this.setState({ dragStartIndex: i})
          })(recordIndex, table.columns[columnIndex].name)}
          onDrop={this.onRowReorder(recordIndex)}
          value={records[rowIndex - 1][table.columns[columnIndex].name]} />
      </CellMeasurer>
    )
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
    const { editRow, id, table, records } = this.props;
    const rowChanges = {
      [table.columns[columnIndex].name]: value,
    }

    editRow(id, records[rowIndex].__id, rowChanges)
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
    const { table, records } = this.props;
    const { filters, cache } = this.state;
    const prevWidth = prevProps.table.columns.reduce((acc, c) => acc + c.width, 0);
    const newWidth = table.columns.reduce((acc, c) => acc + c.width, 0);

    if (prevWidth !== newWidth) {
      cache.clearAll();
      this.forceUpdate();
    }

    if (filters !== prevState.filters || records !== prevProps.records) {
      cache.clearAll();
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
    const { table, records } = this.props;
    const { cache } = this.state;

    if (!table) {
      return <div>The selected table does not exist</div>
    }

    // add a record for the header row
    const totalRecords = [{}, ...records];

    const totalHeight = totalRecords.length < 15 ? totalRecords.reduce((acc, _, i) => acc + cache.rowHeight(i), 0) : 1000;
    const outerHeight = Math.min(totalHeight + 70, 760);

    return (
      <div className="v-table" style={{ height: outerHeight}}>
        <div className="v-table-header">
          <ManagedEditableText text={table.name} onChange={(e) => this.onChangeTableName(e.target.value)} />
          <Icon icon="plus" onClick={this.onAddRow(0)} />
          <Icon icon="columns" onClick={this.onAddColumn} />
        </div>
        <div className="v-table-grid">
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