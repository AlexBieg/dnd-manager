import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import Popover from 'react-tiny-popover'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { arrayMove } from 'react-sortable-hoc';
import { get } from 'lodash';
import {
  getPages,
  getLevels,
  getActivePageId,
  pagesSetActivePage,
  pagesAddPage,
  pagesDeletePage,
  pagesEditPage,
  pagesSetLevels,
} from 'reducers/pages';
import Button from 'components/Button';
import Icon from 'components/Icon';
import PopoverMenu from 'components/PopoverMenu';
import EditableText from 'components/EditableText';
import Importer from 'sections/Importer';
import './Sidebar.scss';


const Sidebar = () => {
  const dispatch = useDispatch();
  const pages = useSelector(getPages);
  const levels = useSelector(getLevels);

  const activeId = useSelector(getActivePageId)
  const [openMenus, setOpenMenus] = useState(new Set());
  const [editingNames, setEditingNames] = useState(new Set());
  const [collapsed, setCollapsed] = useState(levels.map(() => false));


  const onAdd = (id) => (event) => {
    dispatch(pagesAddPage(id));
  }

  const onToggleMenu = (id) => () => {
    if (openMenus.has(id)) {
      openMenus.delete(id);
    } else {
      openMenus.add(id);
    }

    setOpenMenus(new Set(openMenus));
  }

  const onStartEdit = (id) => () => {
    editingNames.add(id);
    setEditingNames(new Set(editingNames));
  }

  const onEndEdit = (id) => () => {
    editingNames.delete(id);
    setEditingNames(new Set(editingNames));
  }

  const onEditName = (id) => (event) => {
    dispatch(pagesEditPage(id, {
      ...pages[id],
      name: event.target.value,
    }))
  }

  const onToggleDropdown = (index) => (event) => {
    const newCollapsed = [...collapsed];
    newCollapsed[index] = !newCollapsed[index];
    setCollapsed(newCollapsed);
  }

  const handleReorderPages = (visible, collapsed, oldLevels) => ({ combine, source, destination, ...reset}) => {
    const startIndex = source.index;

    if (combine) {
      const combIndex = oldLevels.findIndex((l) => l.key === combine.draggableId);
      const newLevels = arrayMove(oldLevels, startIndex, combIndex);
      newLevels[combIndex] = {
        ...newLevels[combIndex ],
        level: newLevels[combIndex - 1].level + 1,
      }
      dispatch(pagesSetLevels(newLevels));
      return;
    }

    const endIndex = destination.index;

    const newLevels = arrayMove(visible, startIndex, endIndex);

    newLevels[endIndex] = {
      ...newLevels[endIndex],
      level: get(newLevels, endIndex + 1, { level: 1 }).level,
    };

    dispatch(pagesSetLevels(newLevels));
  }

  const handleDragStart = (c) => () => {
    setCollapsed(c.map(() => false));
  }

  const getMenuOptions = (id) => {
    return [
      { text: 'Edit', icon: 'edit', onClick: onStartEdit(id) },
      { text: 'Delete', icon: 'trash-alt', onClick: ((id) => () => dispatch(pagesDeletePage(id)))(id) }
    ];
  };

  let visibleLevel = null;
  const visiblePages = levels.reduce((acc, p, i) => {
    if (visibleLevel && p.level <= visibleLevel) {
      visibleLevel = null;
    }

    if (visibleLevel && p.level > visibleLevel) {
      return acc;
    }

    if (!visibleLevel && collapsed[i]) {
      visibleLevel = p.level;
    }

    acc.push(p);

    if (!pages[p.key].name && !editingNames.has(p.key)) {
      onStartEdit(p.key)();
    }
    return acc;
  }, []);

  return (
    <div className="sidebar">
      <div className="header">D&D Manager</div>
      <div className="pages-header">Your Pages</div>
      <div className="pages">
        <DragDropContext onDragStart={handleDragStart(collapsed)} onDragEnd={handleReorderPages(visiblePages, collapsed, levels)}>
          <Droppable className="page-content" droppableId="content" isCombineEnabled>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="pages-list"
              >
                {
                  visiblePages.map(({ key, level}, index) => {
                    const page = pages[key];
                    return(
                      <Draggable key={key} draggableId={key} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={classNames('page-item', { active: key === activeId })}
                            style={{ ...provided.draggableProps.style, paddingLeft: `${level * 20}px`}}
                            key={key}
                            onClick={((id) => () => dispatch(pagesSetActivePage(id)))(key)}
                          >
                            <Icon className="dropdown-caret" icon={collapsed[index] ? 'caret-right' : 'caret-down'} onClick={onToggleDropdown(index)} />
                            <EditableText
                              className="page-name"
                              text={page.name}
                              onBlur={onEndEdit(key)}
                              onChange={onEditName(key)}
                              isEditable={editingNames.has(key)} />
                            <Icon className="add-subpage" icon="plus" onClick={onAdd(key)} />
                            <Popover
                              isOpen={openMenus.has(key)}
                              position={'bottom'} // preferred position
                              content={<PopoverMenu options={getMenuOptions(key)} />}
                              onClickOutside={onToggleMenu(key)}
                            >
                              <Icon className="menu" icon="ellipsis-v" onClick={onToggleMenu(key)}/>
                            </Popover>
                            <Icon className="grip" icon="grip-lines" draggable {...provided.dragHandleProps} />
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                }
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <Button className="add-page" value="Add New Page" onClick={onAdd()} />
      <Importer />
    </div>
  );
};

export default Sidebar;