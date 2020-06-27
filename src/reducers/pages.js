import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit } from 'lodash';

// Selectors
export const getPagesSection = (state) => state.pages;

export const getPages = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.pages,
);

export const getLevels = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.levels,
)

export const getPagesArray = createSelector(
  getPages,
  (pages) => Object.entries(pages).map(([id, p]) => ({ ...p, id, })),
)

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
const PAGES_EDIT_PAGE = 'PAGES_EDIT_PAGE';
const PAGES_SET_LEVELS = 'PAGES_SET_LEVELS';

// Action Creators
export const pagesSetLevels = (newLevels) => {
  return {
    type: PAGES_SET_LEVELS,
    data: newLevels,
  }
}

export const pagesSetActivePage = (id) => {
  return {
    type: PAGES_SET_ACTIVE_PAGE,
    data: id,
  };
};

export const pagesAddPage = (id) => {
  return {
    type: PAGES_ADD_PAGE,
    data: id,
  }
}

export const pagesDeletePage = (id) => {
  return {
    type: PAGES_DELETE_PAGE,
    data: id,
  };
};

export const pagesEditPage = (id, data) => {
  return {
    type: PAGES_EDIT_PAGE,
    data: {
      [id]: data,
    }
  }
}

const INTIAL_PAGE = {
  name: '',
  content: [],
}

// Initial State
const INITIAL_STATE = {
  activePageId: null,
  pages: {},
  levels: [],
}
// Reducer
const pages = (state=INITIAL_STATE, { type, data}) => {
  switch (type) {
    case PAGES_SET_LEVELS:
      return {
        ...state,
        levels: data,
      }
    case PAGES_SET_ACTIVE_PAGE:
      return {
        ...state,
        activePageId: data,
      }
    case PAGES_ADD_PAGE:
      let newId = uuidV4();
      return {
        ...state,
        pages: {
          ...state.pages,
          [newId]: { ...INTIAL_PAGE },
        },
        levels: [...state.levels, { key: newId, level: 1 }]
      };
    case PAGES_DELETE_PAGE:
      return {
        ...state,
        activePageId: (data === state.activePageId ? null : state.activePageId),
        pages: {
          ...omit(state.pages, data),
        },
        levels: state.levels.filter(l => l.key !== data),
      };
    case PAGES_EDIT_PAGE:
      return {
        ...state,
        pages: {
          ...state.pages,
          ...data,
        }
      };
    default:
      return state;
  }
};

export default pages;