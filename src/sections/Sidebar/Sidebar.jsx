import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import Popover from 'react-tiny-popover'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { arrayMove } from 'react-sortable-hoc';
import { get, isEqual } from 'lodash';
import {
  getPages,
  getActivePageId,
  pagesSetActivePage,
  pagesAddPage,
  pagesDeletePage,
  pagesEditPage,
  pagesSetPageOrder,
  getPageOrder,
} from 'reducers/pages';
import { getSidebarWidth, settingsSetSidebarWidth } from 'reducers/settings';
import Button from 'components/Button';
import Icon from 'components/Icon';
import PopoverMenu from 'components/PopoverMenu';
import EditableText from 'components/EditableText';
import Importer from 'sections/Importer';
import './Sidebar.scss';

const buildLevels = (pages, pageOrder, parent=null, level=1, parentCollapsed=false) => {
  let levels = [];

  pageOrder.forEach((id) => {
    const page = pages[id];
    // if the current parent is the page's parent or both are missing
    if (page.parent === parent || (!parent && !page.parent)) {
      levels.push({ ...page, level, key: id, visible: !parentCollapsed });
      levels = [...levels, ...buildLevels(pages, pageOrder, id, level + 1, parentCollapsed || page.collapsed)]
    }
  });

  return levels;
}


const Sidebar = () => {
  const dispatch = useDispatch();
  const pages = useSelector(getPages);
  const pageOrder = useSelector(getPageOrder);
  const width = useSelector(getSidebarWidth);

  const activeId = useSelector(getActivePageId)
  const [openMenus, setOpenMenus] = useState(new Set());
  const [editingNames, setEditingNames] = useState(new Set());


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

  const onToggleDropdown = (id) => (e) => {
    e.stopPropagation();
    dispatch(pagesEditPage(id, { ...pages[id], collapsed: !pages[id].collapsed }));
  }

  const handleReorderPages = useCallback(({ combine, source, destination, draggableId }) => {
    const startIndex = source.index;
    if (combine) {
      const parentId = combine.draggableId;
      dispatch(pagesEditPage(draggableId, { ...pages[draggableId], parent: parentId }))
      return;
    }

    const endIndex = destination.index;

    const newPageOrder = arrayMove(pageOrder, startIndex, endIndex)

    dispatch(pagesSetPageOrder(newPageOrder));

    const belowItemsParent = get(pages, [newPageOrder[endIndex + 1], 'parent'], null);
    dispatch(pagesEditPage(draggableId, { ...pages[draggableId], parent: belowItemsParent }));
  }, [dispatch, pageOrder, pages]);

  const getMenuOptions = (id) => {
    return [
      { text: 'Edit', icon: 'edit', onClick: onStartEdit(id) },
      { text: 'Delete', icon: 'trash-alt', onClick: ((id) => () => dispatch(pagesDeletePage(id)))(id) }
    ];
  };

  const levels = buildLevels(pages, pageOrder);

  if (!isEqual(pageOrder, levels.map(l => l.key))) {
    dispatch(pagesSetPageOrder(levels.map(l => l.key)));
  }

  return (
    <div className="sidebar" style={{ width }}>
      <div className="sidebar-content">
        <div className="header">D&D Manager</div>
        <div className="pages-header">Your Pages</div>
        <DragDropContext onDragEnd={handleReorderPages}>
          <Droppable className="page-content" droppableId="content" isCombineEnabled>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="pages-list"
              >
                {
                  levels.map(({ key, collapsed, name, level, visible }, index) => {
                    return(
                      <Draggable key={key} draggableId={key} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={classNames('page-item', { active: key === activeId, hidden: !visible })}
                            style={{ ...provided.draggableProps.style, paddingLeft: `${level * 20}px`}}
                            key={key}
                            onClick={((id) => () => dispatch(pagesSetActivePage(id)))(key)}
                          >
                            <Icon className="dropdown-caret" icon={collapsed ? 'caret-right' : 'caret-down'} onClick={onToggleDropdown(key)} />
                            <EditableText
                              className="page-name"
                              text={name}
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
        <Button className="add-page" value="Add New Page" onClick={onAdd()} />
        <Importer />
      </div>
      <div className="sidebar-drag-handle" draggable onDragEnd={e => dispatch(settingsSetSidebarWidth(e.clientX))} />
    </div>
  );
};

export default Sidebar;