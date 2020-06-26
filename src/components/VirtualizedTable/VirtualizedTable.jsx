import React, { useState } from 'react';
import { connect, useDispatch } from 'react-redux';
import { arrayMove, SortableHandle } from 'react-sortable-hoc';
import { debounce } from 'lodash';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
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

const HeaderDragHandle = SortableHandle(() => (
  <Icon
    icon="arrows-alt-h"
    draggable
  />
));

const HeaderCell = SortableElement(({
  value,
  onChangeFilters,
  filterValue='',
  deleteable,
  column,
  table,
  tableId
}) => {
  const [dragStart, setDragStart] = useState(null);
  const [filterTerm, setFilterTerm] = useState(filterValue);
  const dispatch = useDispatch();
  const debouncedOnChangeFilters = debounce(onChangeFilters, 500);

  const onChangeColumnName = (newName) => {
    const newCols = table.columns.map((c) => ({
      ...c,
      title: c.name === column.name ? newName : c.title,
    }));

    dispatch(tableEditCols(tableId, newCols));
  }

  const onChangeColumnWidth = (widthChange) => {
    const newCols = table.columns.map((c) => ({
      ...c,
      width: c.name === column.name ? (c.width + widthChange) : c.width
    }))

    dispatch(tableEditCols(tableId, newCols));
  }

  return (
    <th style={{ width: column.width, minWidth: column.width }}>
      <div className="v-header-cell">
        <ManagedEditableText text={value} className="v-header-text" onChange={(e) => onChangeColumnName(e.target.value)} />
        {
          deleteable &&
          <Icon
            icon="trash"
            onClick={() => dispatch(tableDelCol(tableId, column.name))}
          />
        }
        <HeaderDragHandle />
        <Icon
          className="v-header-grip"
          draggable
          icon="grip-lines-vertical"
          onDragStart={e => setDragStart(e.clientX)}
          onDragEnd={e => onChangeColumnWidth(e.clientX - dragStart)}
        />
        <Input
          className="v-table-filter"
          placeholder="Filter..."
          value={filterTerm}
          onChange={e => {
            const val = e.target.value || '';
            setFilterTerm(val);
            debouncedOnChangeFilters(column.name, val);
          }} />
      </div>
    </th>
  );
})

const HeaderRow = SortableContainer(({ tableId, table, filters, onChangeFilters }) => (
  <tr>
    {
      table.columns.map((c, columnIndex) => (
        <HeaderCell
          key={c.name}
          index={columnIndex}
          value={c.title}
          column={c}
          table={table}
          tableId={tableId}
          deleteable={table.idColumn !== table.columns[columnIndex].name}
          onChangeFilters={onChangeFilters}
          filterValue={filters[table.columns[columnIndex].name]}
        />
      ))
    }
  </tr>
));

const RowDragger = SortableHandle(() => (
  <Icon className="grip-lines" icon="grip-lines" draggable />
));

const DataCell = ({
  value,
  tableId,
  recordId,
  recordIndex,
  hasMenu=false,
  showDrag,
  columnName,
}) => {
  const [innerVal, setInnerVal] = useState(value);
  const dispatch = useDispatch();

  const onChangeInner = (val) => {
    setInnerVal(val);
  }

  return (
    <td>
      <div
        className={"v-data-cell"}
        onDragOver={e => e.preventDefault()}
      >
        { showDrag &&  <RowDragger />}
        {
          hasMenu &&
            <Popover options={[
              { text: 'Delete Row', icon: 'trash-alt', onClick: () => dispatch(tableDelRow(tableId, recordId)) },
              { text: 'Add Row Above', icon: 'plus', onClick: () => dispatch(tableAddRow(tableId, recordIndex)) }
            ]}>
              <Icon className="menu" icon="ellipsis-v" />
            </Popover>
        }
        <Editor
          value={innerVal}
          onChange={onChangeInner}
          onBlur={() => dispatch(tableEditRow(tableId, recordId, { [columnName]: innerVal }))}
        />
      </div>
    </td>
  );
}

const DataRow = SortableElement(({ table, record, recordIndex, id }) => (
  <tr>
    {
      table.columns.map((c, columnIndex) => (
        <DataCell
          key={`${c.name}-${record.__id}`}
          hasMenu={columnIndex === 0}
          showDrag={columnIndex === 0}
          columnName={table.columns[columnIndex].name}
          tableId={id}
          recordId={record.__id}
          recordIndex={recordIndex}
          value={record[table.columns[columnIndex].name]} />
      ))
    }
  </tr>
));

const DataGrid = SortableContainer(({ filteredRecords, showCount, table, id }) => (
  <tbody>
    {
      filteredRecords.slice(0, showCount).map((r, recordIndex) => (
        <DataRow key={r.__id} index={recordIndex} table={table} record={r} id={id} recordIndex={recordIndex} />
      ))
    }
</tbody>
));

class VirtualizedTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filters: {},
      filteredRecords: props.records,
      showCount: 20,
    }
  }

  onColumnReorder = ({ oldIndex, newIndex}) => {
    const { table, id, editCols } = this.props;

    if (oldIndex !== newIndex) {
      editCols(id, arrayMove(table.columns, oldIndex, newIndex));
    }
  }

  onRowReorder = ({ oldIndex, newIndex}) => {
    const { table, orderRows, id } = this.props;

    if (oldIndex !== newIndex) {
      orderRows(id, arrayMove(table.rows, oldIndex, newIndex));
    }
  }

  onAddRow = (index=0) => () => {
    const { id, addRow } = this.props;
    addRow(id, index)
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

  onSetFilters = (columnName, term='') => {
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
      showCount: 20,
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

  onChangeTableName = (newName) => {
    const { id, editName } = this.props;

    editName(id, newName);
  }

  handleScroll = (e) => {
    const { filteredRecords, showCount } = this.state;
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;


    if (bottom && showCount <= filteredRecords.length) {
      this.setState({
        showCount: showCount + 20,
      })
    }
  }

  render() {
    const { table, id } = this.props;
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
              <HeaderRow
                table={table}
                tableId={id}
                filters={filters}
                axis="x"
                lockAxis="x"
                onSortEnd={this.onColumnReorder}
                onChangeFilters={this.onSetFilters}
                useDragHandle
              />
            </thead>
            <DataGrid
              lockAxis="y"
              helperClass="dragging-row"
              useDragHandle
              id={id}
              onSortEnd={this.onRowReorder}
              getHelperDimensions={({ node }) => ({
                height: 40,
                width: node.offsetWidth,
              })}
              filteredRecords={filteredRecords}
              table={table}
              showCount={showCount} />
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
  editCols: tableEditCols,
  addRow: tableAddRow,
  addCol: tableAddCol,
  delCol: tableDelCol,
  editName: tableEditName,
  orderRows: tablesOrderRows,
}

export default connect(mapStateToProps, mapDispatchToProps)(VirtualizedTable);