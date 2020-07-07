import { createSelector } from 'reselect';
import { v4 as uuidV4 } from 'uuid';
import { omit } from 'lodash';

// Utils
export const getPagePathUtil = (pageId, pages) => {
  let parent = pages[pageId].parent;
  const path = [];

  while (parent) {
    path.push(parent);
    parent = pages[parent].parent;
  }

  return path;
}

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

export const getPageOrder = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.pageOrder
);

export const getNextPages = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.nextActivePages || [],
);

export const getPreviousPages = createSelector(
  getPagesSection,
  (pagesSect) => pagesSect.previousActivePages || [],
);

// Actions
const PAGES_SET_ACTIVE_PAGE = 'PAGES_SET_ACTIVE_PAGE';
const PAGES_ADD_PAGE = 'PAGES_ADD_PAGE';
const PAGES_DELETE_PAGE = 'PAGES_DELETE_PAGE';
const PAGES_EDIT_PAGE = 'PAGES_EDIT_PAGE';
const PAGES_SET_PAGE_ORDER = 'PAGES_SET_PAGE_ORDER';
const PAGES_GO_BACK = 'PAGES_GO_BACK';
const PAGES_GO_FORWARD = 'PAGES_GO_FORWARD';

// Action Creators
export const pagesGoForward = () => ({
  type: PAGES_GO_FORWARD,
});

export const pagesGoBack = () => ({
  type: PAGES_GO_BACK,
});

export const pagesSetPageOrder = (order) => ({
  type: PAGES_SET_PAGE_ORDER,
  data: order,
});

export const pagesSetActivePage = (id) => {
  return {
    type: PAGES_SET_ACTIVE_PAGE,
    data: id,
  };
};

export const pagesAddPage = (id=null) => {
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
  parent: null,
  collapsed: false,
}

// Initial State
const INITIAL_STATE = {
  activePageId: null,
  previousActivePages: [],
  nextActivePages: [],
  pages: {},
  pageOrder: [],
}
// Reducer
const pages = (state=INITIAL_STATE, { type, data}) => {
  switch (type) {
    case PAGES_GO_FORWARD:
      return {
        ...state,
        activePageId: state.nextActivePages[0],
        previousActivePages: [state.activePageId, ...state.previousActivePages],
        nextActivePages: state.nextActivePages.slice(1)
      }
    case PAGES_GO_BACK:
      return {
        ...state,
        activePageId: state.previousActivePages[0],
        nextActivePages: [state.activePageId, ...(state.nextActivePages || [])],
        previousActivePages: state.previousActivePages.slice(1),
      }
    case PAGES_SET_PAGE_ORDER:
      if (data.length !== Object.keys(state.pages).length) {
        data = Object.keys(state.pages);
      }
      // fix Pages
      Object.values(state.pages).forEach(p => {
        if (p.parent && !state.pages[p.parent]) {
          p.parent = null;
        }
      });

      return {
        ...state,
        pageOrder: data,
      }
    case PAGES_SET_ACTIVE_PAGE:
      return {
        ...state,
        activePageId: data,
        nextActivePages: [],
        ...(
          state.activePageId ?
          { previousActivePages: [state.activePageId, ...(state.previousActivePages || [])].slice(0, 20)} :
          {}
        ),
      }
    case PAGES_ADD_PAGE:
      let newId = uuidV4();
      return {
        ...state,
        pages: {
          ...state.pages,
          [newId]: {
            ...INTIAL_PAGE,
            parent: data,
          },
        },
        pageOrder: [...state.pageOrder, newId]
      };
    case PAGES_DELETE_PAGE:
      return {
        ...state,
        activePageId: (data === state.activePageId ? null : state.activePageId),
        pages: {
          ...omit(state.pages, data),
        },
        pageOrder: state.pageOrder.filter(p => p !== data),
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