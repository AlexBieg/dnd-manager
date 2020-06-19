import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import Modal from 'react-modal';
import CSVReader from 'react-csv-reader'
import Button from 'components/Button';
import Input from 'components/Input';
import { tablesImportTable } from 'reducers/tables';

import './Importer.scss';

Modal.setAppElement('#root');

const Importer = () => {
  const dispatch = useDispatch();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [csvData, setCsvData] = useState(null);
  const [tableName, setTableName] = useState('');
  const [idColumnIndex, setIdColumnIndex] = useState(null);

  const onAddFile = (data, fileInfo) => {
    setCsvData(data);
    setTableName(fileInfo.name.split('.')[0]);
    setIdColumnIndex(0);
  }

  const onImportFile = (data, name, idColumnIndex) => () => {
    dispatch(tablesImportTable(data, name, idColumnIndex));
    setModalIsOpen(false);
  }

  return (
    <div className="importer">
      <Button value="Import CSV" onClick={() => setModalIsOpen(true)} />
      <Modal isOpen={modalIsOpen}>
        <CSVReader onFileLoaded={(data, fileInfo) => onAddFile(data, fileInfo)} />
        <select value={idColumnIndex} name="col" onChange={e => setIdColumnIndex(e.target.value)}>
          {
            !!csvData && csvData[0].map((col, i) => (
              <option value={i} key={i}>{col}</option>
            ))
          }
        </select>
        <Input placeholder="Table Name" value={tableName} onChange={e => setTableName(e.target.value)} />
        <Button value="Import" onClick={onImportFile(csvData, tableName, idColumnIndex)} disabled={!csvData || tableName.length === 0} />
      </Modal>
    </div>
  );
};

export default Importer;