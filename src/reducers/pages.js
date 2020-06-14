import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit, pull, get } from 'lodash';

// Selectors
export const getPagesSection = (state) => state.pages;

export const getPages = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.pages,
);

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

// Action Creators
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
  subpages: [],
}

// Initial State
const INITIAL_STATE = {
  activePageId: null,
  pages: {}
}
// Reducer
const pages = (state=INITIAL_STATE, { type, data}) => {
  let newState;
  switch (type) {
    case PAGES_SET_ACTIVE_PAGE:
      return {
        ...state,
        activePageId: data,
      }
    case PAGES_ADD_PAGE:
      let newId = uuidV4();
      newState = {
        ...state,
        pages: {
          ...state.pages,
          [newId]: { ...INTIAL_PAGE },
        },
      };

      if (data) {
        const subs = get(newState, ['pages', data, 'subpages'], []);
        newState.pages[data].subpages = [...subs, newId]
      }

      return newState;
    case PAGES_DELETE_PAGE:
      newState =  {
        ...state,
        activePageId: (data === state.activePageId ? null : state.activePageId),
        pages: {
          ...omit(state.pages, data),
        },
      };

      Object.values(newState.pages).forEach(p => {
        if ((p.subpages || []).includes(data)) {
          pull(p.subpages, data);
        }
      });

      return newState;
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