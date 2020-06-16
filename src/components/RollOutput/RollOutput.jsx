import React from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { getRolls, rollAction } from 'reducers/rolls';

import './RollOutput.scss';



const Dice = ({ number, disabled }) => (
  <div className={classNames('die', { disabled })}>
    <div className="die-inner">
      {number}
    </div>
  </div>
);

const RollOutput = () => {
  const rolls = useSelector(getRolls);
  const dispatch = useDispatch();

  const rollsOutput = rolls.map((roll) => {
    return roll.results.length > 0 && roll.results.reduce((acc, d, i) => {
      if (roll.adDisAlt.length) {
        acc.push(<Dice key={`${i}-alt`} disabled number={roll.adDisAlt[i]} />);
      }
      acc.push(<Dice key={i} number={d} />)

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
              { !!rolls[i].shift && <div className="roll-shift"> + {rolls[i].shift}</div>}
              <div className="sum"> = {rolls[i].sum}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
};

export default RollOutput;