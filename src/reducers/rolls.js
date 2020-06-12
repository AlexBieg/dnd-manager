// Selectors
export const getRolls = (state) => state.rolls;

// Actions
const ROLLS_ROLL = 'ROLLS_ROLL';

// Action Creators
export const rollAction = (rollText) => {
  return {
    type: ROLLS_ROLL,
    data: rollText,
  }
};

// Reducer
const rolls = (state=[], { type, data}) => {
  switch (type) {
    case ROLLS_ROLL:
      if (data !== state[0]) {
        return [data, ...state];
      } else {
        return [...state];
      }
    default:
      return state;
  }
};

export default rolls;