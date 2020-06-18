import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getPages, pagesEditPage } from 'reducers/pages';
import MultiMediaInput from 'components/MultiMediaInput';
import Popover from 'react-tiny-popover';
import PopoverMenu from 'components/PopoverMenu';
import Icon from 'components/Icon';
import { useSelector, useDispatch } from 'react-redux';

import './Page.scss';

const Page = ({ pageId }) => {
  const page = useSelector(getPages)[pageId];
  const dispatch = useDispatch();
  const [focusRow, setFocusRow] = useState(null);
  const [menuOpen, setMenuOpen] = useState([]);

  const onChangeContent = (index) => (event) => {
    const newContent = [...page.content];
    newContent[index] = event.target.value;
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

  const onFocus = (index) => (event) => {
    setFocusRow(null);
  }

  const onKeyDown = (index) => (event, isEmpty) => {
    if (event.key === 'Enter' && event.shiftKey) {
      const newContent = [...page.content];
      newContent.splice(index + 1, 0, '');
      dispatch(pagesEditPage(pageId, {
        ...page,
        content: newContent,
      }));
      setFocusRow(index + 1);
    }

    if (event.key === 'Backspace' && isEmpty) {
      onDeleteContent(index);
      setFocusRow(index - 1);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  const onAddContent = () => {
    if (page.content.length === 0 || page.content[page.content.length - 1].length > 0) {
      setFocusRow(page.content.length);
      dispatch(pagesEditPage(pageId, {
        ...page,
        content: [...page.content, ''],
      }));
    } else {
      setFocusRow(page.content.length - 1);
    }
  }

  const onDeleteContent = (index) => {
    const newContent = [...page.content];
    newContent.splice(index, 1);
    dispatch(pagesEditPage(pageId, {
      ...page,
      content: newContent,
    }));
  }

  const getMenuOptions = (index) => {
    return [
      {
        text: 'Delete',
        icon: 'trash-alt',
        onClick: ((index) => () => {
          onDeleteContent(index);
          onCloseMenu(index)();
        })(index)
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

  if (!page) {
    return <div>Looks like you don't have a page selected</div>
  }

  return (
    <div className="page" id="page">
      <div className="page-header">{page.name}</div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable className="page-content" droppableId="content">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {page.content.map((c, i) => (
                <Draggable key={i} draggableId={`${i}`} index={i}>
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
                      <MultiMediaInput
                        onChange={onChangeContent(i)}
                        onFocus={onFocus(i)}
                        onKeyDown={onKeyDown(i)}
                        className="media-input"
                        value={c}
                        focus={i === focusRow}
                      />
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