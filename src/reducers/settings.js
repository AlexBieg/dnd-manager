import { createSelector } from 'reselect';

// Selectors
export const getSettings = (state) => state.settings;

export const getSidebarWidth = createSelector(
  getSettings,
  (settings) => settings.sidebarWidth
);

export const getRollerbarWidth = createSelector(
  getSettings,
  (settings) => settings.rollerbarWidth
);

// Actions
const SETTINGS_SET_SIDEBAR_WIDTH = 'SETTINGS_SET_SIDEBAR_WIDTH';
const SETTINGS_SET_ROLLERBAR_WIDTH = 'SETTINGS_SET_ROLLERBAR_WIDTH';

// Action Creators
export const settingsSetSidebarWidth = (width) => ({
  type: SETTINGS_SET_SIDEBAR_WIDTH,
  data: width,
});

export const settingsSetRollerbarWidth = (width) => ({
  type: SETTINGS_SET_ROLLERBAR_WIDTH,
  data: width,
});

// Reducer
const settings = (state={ sidebarWidth: 100, rollerbarWidth: 100 }, { type, data }) => {
  switch (type) {
    case SETTINGS_SET_SIDEBAR_WIDTH:
      return {
        ...state,
        sidebarWidth: Math.max(100, data),
      }
    case SETTINGS_SET_ROLLERBAR_WIDTH:
      return {
        ...state,
        rollerbarWidth: Math.max(100, data),
      }
    default:
      return state;
  }
};

export default settings;