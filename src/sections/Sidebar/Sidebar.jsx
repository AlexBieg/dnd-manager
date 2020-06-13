import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import Popover from 'react-tiny-popover'
import { getPages, getActivePageId, pagesSetActivePage, pagesAddPage, pagesDeletePage } from 'reducers/pages';
import Button from 'components/Button';
import Icon from 'components/Icon';
import PopoverMenu from 'components/PopoverMenu';
import './Sidebar.scss';

const Sidebar = () => {
  const dispatch = useDispatch();
  const pages = useSelector(getPages);
  const activeId = useSelector(getActivePageId)
  const [openMenus, setOpenMenus] = useState(new Set());

  const onAdd = (event) => {
    dispatch(pagesAddPage());
  }

  const onToggleMenu = (id) => (event) => {
    if (openMenus.has(id)) {
      openMenus.delete(id);
    } else {
      openMenus.add(id);
    }

    setOpenMenus(new Set(openMenus));
  }

  const getMenuOptions = (id) => {
    return [
      { text: 'Edit', icon: 'edit', onClick: ((id) => () => console.log('editing', id))(id) },
      { text: 'Delete', icon: 'trash-alt', onClick: ((id) => () => dispatch(pagesDeletePage(id)))(id) }
    ];
  };

  return (
    <div className="sidebar">
      <div className="header">D&D Manager</div>
      <div className="pages">
        <div className="pages-header">Your Pages</div>
        <div className="pages-list">
          {
            Object.entries(pages).map(([key, p]) => (
              <div
                className={classNames('page-item', { active: key === activeId })}
                key={key}
                onClick={((id) => () => dispatch(pagesSetActivePage(id)))(key)}
              >
                <span className="page-name">
                  {p.name}
                </span>
                <Popover
                  isOpen={openMenus.has(key)}
                  position={'bottom'} // preferred position
                  content={<PopoverMenu options={getMenuOptions(key)} />}
                  onClickOutside={onToggleMenu(key)}
                >
                  <Icon className="menu" icon="ellipsis-v" onClick={onToggleMenu(key)}/>
                </Popover>
              </div>
            ))
          }
        </div>
      </div>
      <Button className="add-page" value="Add New Page" onClick={onAdd} />
    </div>
  );
};

export default Sidebar;