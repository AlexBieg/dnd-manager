import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  getPages,
  pagesEditPage,
  pagesSetActivePage,
  getPagePathUtil,
  getNextPages,
  getPreviousPages,
  pagesGoBack,
  pagesGoForward,
} from 'reducers/pages';
import Editor from 'components/Editor';
import { v4 as uuidV4 } from 'uuid';
import Popover from 'react-tiny-popover';
import PopoverMenu from 'components/PopoverMenu';
import Icon from 'components/Icon';
import TableSelector from 'components/TableSelector';
import Table from 'components/VirtualizedTable';
import RecordViewer from 'components/RecordViewer';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';

import './Page.scss';

const tableIdRegex = /^@@([a-zA-Z0-9-]+)@@$/;

const Page = ({ pageId }) => {
  const pages = useSelector(getPages);
  const nextPages = useSelector(getNextPages);
  const previousPages = useSelector(getPreviousPages);
  const page = pages[pageId];
  const dispatch = useDispatch();
  const [focusRow, setFocusRow] = useState(null);
  const [menuOpen, setMenuOpen] = useState([]);

  const onChangeContent = (index) => (content) => {
    const newContent = [...page.content];
    newContent[index] = {
      ...newContent[index],
      content
    };
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }));
  }

  const onOpenMenu = (index) => () => {
    setMenuOpen([...menuOpen, index])
  }

  const onCloseMenu = (index) => () => {
    setMenuOpen(menuOpen.filter(m => m !== index));
  }

  const onFocus = () => {
    setTimeout(() => {
      setFocusRow(null);
    }, 0);
  }

  const handleNext = (index) => (e) => {
    const newContent = [...page.content];
    newContent.splice(index + 1, 0, { id: uuidV4(), content: null });
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }));
    setFocusRow(index + 1);
  }

  const onAddContent = () => {
    setFocusRow(page.content.length);
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: [...page.content, { id: uuidV4(), content: null }],
    }));
  }

  const onDeleteContent = (index) => () => {
    const newContent = [...page.content];
    newContent.splice(index, 1);

    if (index === 0) {
      setFocusRow(0);
    } else {
      setFocusRow(index - 1);
    }

    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }));
  }

  const onAddTable = (i) => {
    const newContent = [...page.content];
    newContent[i] = {
      ...newContent[i],
      content: 'select_table'
    };
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }))
  }

  const onChooseTable = (i) => (id) => {
    const newContent = [...page.content];
    newContent[i] = {
      ...newContent[i],
      content: `@@${id}@@`
    };
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }))
  }

  const getMenuOptions = (index) => {
    return [
      {
        text: 'Delete',
        icon: 'trash-alt',
        onClick: ((index) => () => {
          onDeleteContent(index)();
          onCloseMenu(index)();
        })(index)
      },
      {
        text: 'Add Table',
        icon: 'columns',
        onClick: ((i) => () => {
          onAddTable(i);
          onCloseMenu(i)();
        })(index),
      }
    ];
  };

  const onDragEnd = (data) => {
    const start = data.source.index;
    const end = data.destination.index;
    let newContent = [...page.content];

    newContent.splice(end, 0, newContent.splice(start, 1)[0])

    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }));
  }

  const onHandlePageClick = (id) => () => dispatch(pagesSetActivePage(id));

  if (!page) {
    return <div>Looks like you don't have a page selected</div>
  }

  return (
    <div className="page" id="page">
      <RecordViewer />
      <div className="page-navigation">
        <Icon className={classNames({ disabled: previousPages.length === 0 })} icon="chevron-left" onClick={() => dispatch(pagesGoBack())}/>
        <Icon className={classNames({ disabled: nextPages.length === 0 })} icon="chevron-right" onClick={() => dispatch(pagesGoForward())}/>
      </div>
      <div className="page-path">
        {getPagePathUtil(pageId, pages).reverse().map(p => (
          <span key={p} onClick={onHandlePageClick(p)}>{pages[p].name}</span>
        ))}
      </div>
      <div className="page-header">{page.name}</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable className="page-content" droppableId="content">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {(page.content || []).map((c, i) => (
                <Draggable key={c.id} draggableId={c.id} index={i}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="content-row"
                    >
                      <Icon className="grip" icon="grip-lines" {...provided.dragHandleProps} />
                      <Popover
                        isOpen={menuOpen.includes(i)}
                        position={'bottom'}
                        content={<PopoverMenu options={getMenuOptions(i)} />}
                        onClickOutside={onCloseMenu(i)}
                      >
                        <Icon className="menu" icon="ellipsis-v" onClick={onOpenMenu(i)}/>
                      </Popover>
                      {
                        c.content === 'select_table' &&
                        <TableSelector onChange={onChooseTable(i)} />
                      }
                      {
                        typeof c.content === 'string' && c.content.match(tableIdRegex) != null &&
                        <Table id={c.content.match(tableIdRegex)[1]} />
                      }
                      {
                        typeof c.content !== 'string' &&
                        <Editor
                          onNext={handleNext(i)}
                          onDelete={onDeleteContent(i)}
                          value={c.content}
                          onFocus={onFocus}
                          focus={i === focusRow}
                          onChange={onChangeContent(i)} />
                      }

                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <div className="add-content-section" onClick={onAddContent} />
    </div>
  );
};

export default Page;