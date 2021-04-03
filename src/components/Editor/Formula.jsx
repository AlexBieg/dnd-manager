import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { getTables } from 'reducers/tables';
import Input from 'components/Input';

const Formula = ({ attributes, formula, formulaId, children, onChange = () => {} }) => {
  const [currentFormula, setCurrentFormula] = useState(formula);
  const [isEditing, setIsEditing] = useState(false);
  const tables = useSelector(getTables);

  // This function can be used within the formulas
  // eslint-disable-next-line
  const getTableIdsByName = (name) => {
    return Object.entries(tables).filter(([_id, table]) => table.name === name).map(([id]) => id);
  }

  if (isEditing) {
    return (
      <span {...attributes} className="formula">
        <Input
          value={currentFormula}
          onChange={(e) => setCurrentFormula(e.target.value)}
          autoFocus
          onBlur={() => {
            setIsEditing(false);
            onChange(currentFormula.length ? currentFormula : '"Set a formula..."', formulaId);
          }} />
        {children}
      </span>
    );
  }

  let val;
  try {
    //Eval is a required function here to allow users to create their own formulas
    // eslint-disable-next-line
    val = eval(currentFormula)
  } catch (e) {
    console.log(e);
    val = `Invalid formula: ${formula}`;
  }

  if (typeof val === 'object') {
    val = val.toString();
  }

  if (!val) {
    val = 'No returned value';
  }

  return (
    <span {...attributes} className="formula" onClick={() => setIsEditing(true)}>
      {val}
      {children}
    </span>
  )
}

export default Formula;