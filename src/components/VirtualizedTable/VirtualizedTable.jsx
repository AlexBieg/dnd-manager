import React, { useState, useCallback } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';
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
  getFiltersByTableId,
  tablesSetFilters,
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
  deleteable,
  column,
  table,
  tableId
}) => {
  const [dragStart, setDragStart] = useState(null);
  const filters = useSelector(getFiltersByTableId(tableId));
  const [filter, setFilter] = useState(filters[column.name] || {});
  const dispatch = useDispatch();
  const debouncedDispatch = useCallback(debounce(dispatch, 500), [dispatch]);

  const onChangeFilters = useCallback((col, fil) => {
    setFilter(fil);
    dispatch(tablesSetFilters(tableId, {...filters, [col]: fil }));
  }, [dispatch, filters, tableId]);

  const debouncedOnChangeFilters = useCallback((col, fil) => {
    debouncedDispatch(tablesSetFilters(tableId, { ...filters, [col]: fil }))
  }, [debouncedDispatch, filters, tableId]);

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
        <div className="v-header-filter-wrapper">
          <Input
            className="v-table-filter"
            placeholder="Filter..."
            value={filter.term || ''}
            onChange={e => {
              const val = e.target.value || '';
              setFilter({ ...filter, term: val });
              debouncedOnChangeFilters(column.name, { ...filter, term: val });
            }} />
          {
            (filter.type === 'includes' || !filter.type) &&
            <Icon icon="dot-circle" onClick={() => onChangeFilters(column.name, { ...filter, type: 'exact' })} />
          }
          {
            filter.type === 'exact' &&
            <Icon icon="circle" onClick={() => onChangeFilters(column.name, { ...filter, type: 'includes' })} />
          }
          {
            filter.sort === 'asc' &&
            <Icon icon="sort-up" onClick={() => onChangeFilters(column.name, { ...filter, sort: 'desc' })} />
          }
          {
            filter.sort === 'desc' &&
            <Icon icon="sort-down" onClick={() => onChangeFilters(column.name, { ...filter, sort: null })} />
          }
          {
            !filter.sort &&
            <Icon icon="sort" onClick={() => onChangeFilters(column.name, { ...filter, sort: 'asc' })} />
          }
        </div>
      </div>
    </th>
  );
})

const HeaderRow = SortableContainer(({ tableId, table }) => (
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

const DataGrid = SortableContainer(({ filteredRecords, limit, offset, table, id }) => (
  <tbody>
    {
      filteredRecords.slice(offset, limit + offset).map((r, recordIndex) => (
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
      filteredRecords: this.getFilteredRecordsFromFilters(props.records, props.filters),
      limit: 20,
      offset: 0,
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
    const sorts = {};
    const r = records.filter((r) => {
      return Object.entries(filters).every(([cName, { term='', type, sort }]) => {
        if (sort) {
          sorts[cName] = sort;
        }

        let text;
        if (typeof r[cName] === 'object') {
          text = r[cName].map(n => Node.string(n))[0];
        } else {
          text = r[cName];
        }

        switch (type) {
          case 'exact':
            return (text || '').toLowerCase() === term.toLowerCase();
          default:
            return (text || '').toLowerCase().includes(term.toLowerCase());
        }
      });
    });

    const sortArray = Object.entries(sorts);
    if (sortArray.length) {
      r.sort((a, b) => {
        for (let i = 0; i < sortArray.length; i++) {
          const [column, sortDir] = sortArray[i];

          const aText = typeof a[column] === 'string' ? a[column] : (a[column] || []).map(n => Node.string(n))[0] || '';
          const bText = typeof b[column] === 'string' ? b[column] : (b[column] || []).map(n => Node.string(n))[0] || '';
          const aNum = parseFloat(aText);
          const bNum = parseFloat(bText);

          let diff;
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
          } else {
            diff = sortDir === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
          }


          if (diff !== 0) {
            return diff;
          }
        }

        return 0;
      });
    }

    return r;
  }

  componentDidUpdate(prevProps) {
    const { records, filters } = this.props;

    if (records !== prevProps.records || filters !== prevProps.filters) {
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
    const { filteredRecords, limit, offset } = this.state;
    const bottom = e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight;
    const top = e.target.scrollTop === 0;


    if (bottom && limit <= filteredRecords.length) {
      this.setState({
        offset: offset + limit,
      });
      e.target.scrollTop = 1;
    } else if (top && offset > 0) {
      this.setState({
        offset: offset - limit,
      });
      e.target.scrollTop = e.target.scrollHeight + e.target.clientHeight;
    }
  }

  render() {
    const { table, id } = this.props;
    const { filteredRecords, outerHeight, limit, offset, filters } = this.state;

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
              limit={limit}
              offset={offset} />
          </table>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => ({
  table: getTableById(props.id)(state),
  records: getRecordsByTableId(props.id)(state),
  filters: getFiltersByTableId(props.id)(state),
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