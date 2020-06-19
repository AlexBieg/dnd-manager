import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import Popover from 'react-tiny-popover'
import {
  getPages,
  getActivePageId,
  pagesSetActivePage,
  pagesAddPage,
  pagesDeletePage,
  pagesEditPage,
} from 'reducers/pages';
import Button from 'components/Button';
import Icon from 'components/Icon';
import PopoverMenu from 'components/PopoverMenu';
import EditableText from 'components/EditableText';
import Importer from 'sections/Importer';
import './Sidebar.scss';

const buildOrderAndLevels = (pages) => {
  const seen = [];
  const results = [];

  Object.entries(pages).forEach(([key, page]) => {
    if (seen.includes(key)) {
      return;
    }

    let nextLevel = [];
    let thisLevel = [key];
    let level = 1;

    while (thisLevel.length > 0) {
      const pageId = thisLevel.pop();
      seen.push(pageId);

      results.push({
        key: pageId,
        page: pages[pageId],
        level,
      });

      if ((pages[pageId].subpages || []).length) {
        nextLevel.push(...(pages[pageId].subpages));
      }

      if (thisLevel.length === 0) {
        thisLevel = nextLevel;
        nextLevel = [];
        level++;
      }
    }
  });

  return results;
}


const Sidebar = () => {
  const dispatch = useDispatch();
  const pages = useSelector(getPages);
  const orderedPages = buildOrderAndLevels(pages);

  const activeId = useSelector(getActivePageId)
  const [openMenus, setOpenMenus] = useState(new Set());
  const [editingNames, setEditingNames] = useState(new Set());
  const [collapsed, setCollapsed] = useState(orderedPages.map(() => false));


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

  const getMenuOptions = (id) => {
    return [
      { text: 'Edit', icon: 'edit', onClick: onStartEdit(id) },
      { text: 'Delete', icon: 'trash-alt', onClick: ((id) => () => dispatch(pagesDeletePage(id)))(id) }
    ];
  };

  let visibleLevel = null;
  const visiblePages = orderedPages.reduce((acc, p, i) => {
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

    if (!p.page.name && !editingNames.has(p.key)) {
      onStartEdit(p.key)();
    }
    return acc;
  }, []);



  return (
    <div className="sidebar">
      <div className="header">D&D Manager</div>
      <div className="pages">
        <div className="pages-header">Your Pages</div>
        <div className="pages-list">
          {
            visiblePages.map(({ key, page, level}, index) => {
              return(
                <div
                  className={classNames('page-item', { active: key === activeId })}
                  style={{paddingLeft: `${level * 20}px`}}
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
                </div>
              );
            })
          }
        </div>
      </div>
      <Button className="add-page" value="Add New Page" onClick={onAdd()} />
      <Importer />
    </div>
  );
};

export default Sidebar;