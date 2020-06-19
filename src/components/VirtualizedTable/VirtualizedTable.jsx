import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  get,
  debounce,
} from 'lodash';
import {
  MultiGrid,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized';
import Popover from 'react-tiny-popover'
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
import PopoverMenu from 'components/PopoverMenu';

import 'react-virtualized/styles.css'
import './VirtualizedTable.scss';

const cache = new CellMeasurerCache({
  defaultWidth: 150,
  defaultHeight: 100,
  fixedWidth: true
});

const HeaderCell = ({ style, value, onChangeColWidth, onChangeFilters, filterValue='' }) => {
  const [dragStart, setDragStart] = useState(null);

  return (
    <div style={style} className="v-header-cell">
      <ManagedEditableText text={value} className="v-header-text" />
      <Icon
        icon="trash"
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
        placeholder="filter"
        value={filterValue}
        onChange={e => onChangeFilters(e.target.value)} />
    </div>
  );
}

const menuOptions = [
  { text: 'Delete', icon: 'trash-alt', onClick: () => {console.log('deleting row')} }
]

const DataCell = ({ style, value, onChange, hasMenu=false }) => {
  const debouncedOnChange = debounce(onChange, 300);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  return (
    <div style={style} className="v-data-cell">
      {
        hasMenu &&
          <Popover
            isOpen={menuIsOpen}
            position={'bottom'} // preferred position
            content={(props) => {
              console.log(props);
              return <PopoverMenu options={menuOptions} />
            }}
            onClickOutside={() => setMenuIsOpen(false)}
          >
            <Icon className="menu" icon="ellipsis-v" onClick={() => setMenuIsOpen(true)}/>
          </Popover>
      }
      <MultiMediaInput
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
    }
  }

  onRenderCell = ({ columnIndex, rowIndex, key, style, parent }) => {
    const { table } = this.props;
    const { filteredRecords, filters } = this.state;


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
            onChangeFilters={this.onSetFilters(table.columns[columnIndex].name)}
            filterValue={filters[table.columns[columnIndex].name]}
          />
        </CellMeasurer>
      )
    }
    return (
      <CellMeasurer
        cache={cache}
        key={key}
        columnIndex={columnIndex}
        parent={parent}
        rowIndex={rowIndex}
      >
        <DataCell
          style={{...style}}
          onChange={this.onEditCell(columnIndex, rowIndex - 1)}
          hasMenu={columnIndex === 0}
          value={filteredRecords[rowIndex - 1][table.columns[columnIndex].name]} />
      </CellMeasurer>
    )
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
    const { filters } = this.state;
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

  render() {
    const { table } = this.props;
    const { filteredRecords} = this.state;

    cache.clearAll();

    // add a record for the header row
    const totalRecords = [{}, ...filteredRecords];

    return (
      <div className="v-table">
        <div className="v-table-header">{table.name}</div>
        <AutoSizer>
          {
            ({ width, height }) => (
              <MultiGrid
                headerHeight={30}
                height={height}
                width={width}
                styleTopRightGrid={{ borderBottom: 'solid 1px #cecece' }}
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
  editCols: tableEditCols,
}

export default connect(mapStateToProps, mapDispatchToProps)(VirtualizedTable);