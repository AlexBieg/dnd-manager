import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getPages, pagesEditPage } from 'reducers/pages';
import MultiMediaInput from 'components/MultiMediaInput';
import Editor from 'components/Editor';
import { v4 as uuidV4 } from 'uuid';
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

  const onFocus = (index) => (event) => {
    setFocusRow(null);
  }

  const handleNext = (index) => () => {
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
                      <Editor
                        onNext={handleNext(i)}
                        value={c.content}
                        onFocus={onFocus(i)}
                        focus={i === focusRow}
                        onChange={onChangeContent(i)} />
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