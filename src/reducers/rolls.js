import { get } from 'lodash';

// Utils
const reg = /(?<number>\d+)?[dD](?<sides>\d+)(?<shift>[+-]\d+)?(?<adDis>[ad])?/;

const rollDice = (text) => {
  const results = [];
  const adDisAlt = [];

  const match = (text || '').match(reg);
  const data = get(match, 'groups', {});

  data.sides = parseInt(data.sides);
  data.number = parseInt(data.number) || 1;
  data.shift = parseInt(data.shift || 0);

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
    shift: data.shift,
    sum: results.reduce((acc, r) => acc + r, 0)
  };
}

// Selectors
export const getRolls = (state) => state.rolls;

// Actions
const ROLLS_ROLL = 'ROLLS_ROLL';

// Action Creators
export const rollAction = (rollText) => {
  return {
    type: ROLLS_ROLL,
    data: {
      rollText,
      ...rollDice(rollText),
    },
  }
};

// Reducer
const rolls = (state=[], { type, data}) => {
  switch (type) {
    case ROLLS_ROLL:
      return [
        { ...data },
        ...state,
      ]
    default:
      return state;
  }
};

export default rolls;