import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { useSelector, useDispatch } from 'react-redux';
import { tableEditRow, tablesSetActiveRecord, getActiveRecord, getRecordById, getTableById } from 'reducers/tables';
import Editor from 'components/Editor';

import './RecordViewer.scss';

Modal.setAppElement('#root')

const RecordViewer = () => {
  const activeRecordId = useSelector(getActiveRecord);
  const record = useSelector(getRecordById(activeRecordId)) || {};
  const table = useSelector(getTableById(record.__tableId));
  const [currentRecord, setCurrentRecord] = useState(record);
  const dispatch = useDispatch();

  // useEffect(() => {
  //   setCurrentRecord(record);
  // }, [record, record.__id]);

  if (currentRecord.__id !== record.__id) {
    setCurrentRecord(record);
  }

  if (!table) {
    return <div />
  }

  const handleChange = (cName) => (newVal) => {
    setCurrentRecord({ ...currentRecord, [cName]: newVal });
  }

  console.log(record, currentRecord);

  return (
    <Modal
      overlayClassName="record-viewer-overlay"
      className="record-viewer-modal"
      isOpen={!!activeRecordId}
      onRequestClose={() => dispatch(tablesSetActiveRecord(null))}
    >
      <div className="record-viewer">
        {
          table.columns.map(c => (
            <div key={c.name} className="row">
              <div className="title">{c.title}</div>
              <Editor
                className="value"
                value={currentRecord[c.name]}
                onChange={handleChange(c.name)}
                onBlur={() => dispatch(tableEditRow(record.__tableId, record.__id, currentRecord))}
              />
            </div>
          ))
        }
      </div>
    </Modal>
  )
}

export default RecordViewer;