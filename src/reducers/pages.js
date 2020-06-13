import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit } from 'lodash';

// Selectors
export const getPagesSection = (state) => state.pages;

export const getPages = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.pages,
);

export const getActivePageId = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.activePageId,
);

export const getActivePage = createSelector(
  getPages,
  getActivePageId,
  (pages, id) => pages[id],
);

// Actions
const PAGES_SET_ACTIVE_PAGE = 'PAGES_SET_ACTIVE_PAGE';
const PAGES_ADD_PAGE = 'PAGES_ADD_PAGE';
const PAGES_DELETE_PAGE = 'PAGES_DELETE_PAGE';

// Action Creators
export const pagesSetActivePage = (id) => {
  return {
    type: PAGES_SET_ACTIVE_PAGE,
    data: id,
  };
};

export const pagesAddPage = () => {
  return {
    type: PAGES_ADD_PAGE,
  }
}

export const pagesDeletePage = (id) => {
  return {
    type: PAGES_DELETE_PAGE,
    data: id,
  };
};

// Initial State
const INITIAL_STATE = {
  activePageId: 'asdf',
  pages: {
    asdf: { name: 'test1' },
    fdsa: { name: 'test2' }
  }
}
// Reducer
const rolls = (state=INITIAL_STATE, { type, data}) => {
  switch (type) {
    case PAGES_SET_ACTIVE_PAGE:
      return {
        ...state,
        activePageId: data,
      }
    case PAGES_ADD_PAGE:
      return {
        ...state,
        pages: {
          ...state.pages,
          [uuidV4()]: { name: 'Untitled' },
        },
      };
    case PAGES_DELETE_PAGE:
      return {
        ...state,
        activePageId: (data === state.activePageId ? null : state.activePageId),
        pages: {
          ...omit(state.pages, data),
        },
      };
    default:
      return state;
  }
};

export default rolls;