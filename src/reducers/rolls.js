import { get } from 'lodash';

// Utils
const diceRegex = /(?<number>\d+)?[dD](?<sides>\d+)/;
const numRegex = /^[+-][0-9]+$/

const rollDice = (text) => {
  const results = [];
  let shift = 0;

  const allDice = text.split(/(?=[+-])/).filter(v => v.length > 0)

  for (const dice of allDice) {
    if (numRegex.test(dice)) {
      shift += parseInt(dice)
      continue;
    }

    const match = (dice || '').match(diceRegex);
    const data = get(match, 'groups', {});

    data.sides = parseInt(data.sides);
    data.number = parseInt(data.number) || 1;

    for (let i = 0; i < data.number; i++) {
      results.push([Math.floor(Math.random() * data.sides + 1), data.sides]);
    }
  }

  return {
    results,
    shift: shift,
    sum: results.reduce((acc, [val, sides]) => acc + val, 0) + shift,
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