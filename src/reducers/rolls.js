import { get } from 'lodash';
import { createSelector } from 'reselect';

// Utils
const diceRegex = /(?<number>\d+)?[dD](?<sides>\d+)/;
const numRegex = /^[+-][0-9]+$/

const parseRollText = (text) => {
  let shift = 0;
  const dice = []

  const allDice = text.split(/(?=[+-])/).filter(v => v.length > 0)

  for (const diceText of allDice) {
    if (numRegex.test(diceText)) {
      shift += parseInt(diceText)
      continue;
    }

    const match = (diceText || '').match(diceRegex);
    const data = get(match, 'groups', {});

    const sides = parseInt(data.sides);
    const number = parseInt(data.number) || 1;

    for (let i = 0; i < number; i++) {
      dice.push(sides);
    }
  }

  return {
    dice,
    shift,
    text,
  };
}

// Selectors
export const getRolls = (state) => state.rolls;
export const getCurrentRoll = createSelector(
  getRolls,
  rolls => rolls.currentRoll,
)
export const getPastRolls = createSelector(
  getRolls,
  rolls => rolls.pastRolls,
)

// Actions
const ROLLS_ROLL = 'ROLLS_ROLL';
const ROLLS_LOG_ROLL = 'ROLLS_LOG_ROll';

// Action Creators
export const rollAction = (rollText) => {
  return {
    type: ROLLS_ROLL,
    data: parseRollText(rollText),
  }
};

export const logRollAction = (results) => {
  return {
    type: ROLLS_LOG_ROLL,
    data: results,
  }
}

const initialState = {
  pastRolls: [],
  currentRoll: null,
}

// Reducer
const rolls = (state=initialState, { type, data}) => {
  switch (type) {
    case ROLLS_ROLL:
      return {
        ...state,
        currentRoll: data
      }
    case ROLLS_LOG_ROLL:
      return {
        ...state,
        currentRoll: null,
        pastRolls: [
          {...data},
          ...state.pastRolls,
        ]
      }
    default:
      return state;
  }
};

export default rolls;