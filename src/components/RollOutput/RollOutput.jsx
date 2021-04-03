import React from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { getRolls, rollAction } from 'reducers/rolls';

import './RollOutput.scss';

const DICE_OPTIONS = [2, 4, 6, 8, 10, 12, 20]



const Dice = ({ number, disabled, sides }) => (
  <i className={classNames(`df-d${sides}-${number}`, 'die', {disabled})}>{!DICE_OPTIONS.includes(sides) ? number : ''}</i>
);

const RollOutput = () => {
  const rolls = useSelector(getRolls);
  const dispatch = useDispatch();

  const rollsOutput = rolls.map((roll) => {
    return roll.results.length > 0 && roll.results.reduce((acc, [num, sides], i) => {
      acc.push(<Dice key={i} number={num} sides={sides} />)
      return acc;
    }, [])
  });

  const onReRoll = (i) => () => {
    dispatch(rollAction(rolls[i].rollText))
  }

  return (
    <div className="all-rolls">
      {
        rollsOutput.map((out, i) => (
          <div className="roll-output" key={i}>
            <div className="roll-text">{rolls[i].rollText}</div>
            <div className="roll-dice" onClick={onReRoll(i)}>
              { out }
              { !!rolls[i].shift && <div className="roll-shift">
                {rolls[i].shift >= 0 ? '+' : '-'}
                {Math.abs(rolls[i].shift)}
              </div>}
              <div className="sum"> = {rolls[i].sum}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
};

export default RollOutput;