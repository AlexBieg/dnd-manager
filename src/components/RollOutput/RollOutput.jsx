import React from 'react';
import { get } from 'lodash';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { getRolls } from 'reducers/rolls';

import './RollOutput.scss';

const reg = /(?<number>\d+)?[dD](?<sides>\d+)(?<shift>[+-]\d+)?(?<adDis>[ad])?/;

const rollDice = (data = {}) => {
  const results = [];
  const adDisAlt = [];

  for (let i = 0; i < data.number; i++) {
    if (data.adDis === 'a') {
      const a = Math.floor(Math.random() * data.sides + 1);
      const b = Math.floor(Math.random() * data.sides + 1);

      results.push(Math.max(a, b));
      adDisAlt.push(Math.min(a, b));
    } else if (data.adDis === 'd') {
      const a = Math.floor(Math.random() * data.sides + 1);
      const b = Math.floor(Math.random() * data.sides + 1);

      results.push(Math.min(a, b));
      adDisAlt.push(Math.max(a, b));
    } else {
      results.push(Math.floor(Math.random() * data.sides + 1));
    }
  }

  return {
    results,
    adDisAlt,
  };
}

const Dice = ({ number, disabled }) => (
  <div className={classNames('die', { disabled })}>
    <div className="die-inner">
      {number}
    </div>
  </div>
);

const RollOutput = () => {
  const rolls = useSelector(getRolls);
  const match = (rolls[0] || '').match(reg);
  const data = get(match, 'groups', {});

  data.sides = parseInt(data.sides);
  data.number = parseInt(data.number) || 1;
  data.shift = parseInt(data.shift || 0);

  const { adDisAlt, results: dice } = rollDice(data);
  const sum = dice.reduce((acc, num) => acc + num, 0) + data.shift;

  const dComps = rolls.length > 0 && dice.reduce((acc, d, i) => {
    if (adDisAlt.length) {
      acc.push(<Dice disabled number={adDisAlt[i]} />);
    }
    acc.push(<Dice number={d} />)

    return acc;
  }, [])

  return (
    <div className="roll-output">
      { dComps }
      { rolls.length > 0 && !!data.shift && <div> + {data.shift}</div>}
      { rolls.length > 0 && <div className="sum"> = {sum}</div> }
    </div>
  );
};

export default RollOutput;