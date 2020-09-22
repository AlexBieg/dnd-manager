import React, { useState } from 'react';
import Input from 'components/Input';

const Formula = ({ attributes, formula, formulaId, children, onChange = () => {} }) => {
  const [currentFormula, setCurrentFormula] = useState(formula);
  const [isEditing, setIsEditing] = useState(false);

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
    val = `Invalid formula: ${formula}`;
  }

  return (
    <span {...attributes} className="formula" onClick={() => setIsEditing(true)}>
      {val}
      {children}
    </span>
  )
}

export default Formula;