import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { rollAction, getRolls } from 'reducers/rolls';
import Button from 'components/Button';
import Input from 'components/Input';
import './Roller.scss';

const Roller = () => {
  const dispatch = useDispatch();
  const [rollText, setRollText] = useState('');
  const prevRolls = useSelector(getRolls);
  const [prevRollIndex, setprevRollIndex] = useState(-1);

  const onKey = (event) => {
    if (event.key === 'Enter') {
      onSubmit();
      return;
    }

    if (event.key === 'ArrowUp') {
      if (prevRollIndex < prevRolls.length - 1) {
        setprevRollIndex(prevRollIndex + 1);
        setRollText(prevRolls[prevRollIndex + 1].rollText);
      }
    }

    if (event.key === 'ArrowDown') {
      if (prevRollIndex > 0) {
        setprevRollIndex(prevRollIndex - 1);
        setRollText(prevRolls[prevRollIndex - 1].rollText);
      } else {
        setRollText('');
        setprevRollIndex(-1);
      }
    }
  };

  const onSubmit = () => {
    dispatch(rollAction(rollText.length ? rollText : '1d20'));
    setprevRollIndex(-1);
  }

  return (
    <div className="roller">
      <Input
        value={rollText}
        placeholder="ex:1d20"
        type='text'
        onChange={(event) => setRollText(event.target.value)}
        onKeyDown={onKey}/>
      <Button value="Roll" onClick={onSubmit} />
    </div>
  );
};

export default Roller;