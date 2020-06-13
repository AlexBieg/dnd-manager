import React from 'react';
import { getPages } from 'reducers/pages';
import { useSelector } from 'react-redux';

import './Page.scss';

const Page = ({ pageId }) => {
  const page = useSelector(getPages)[pageId];
  if (!page) {
    return <div>Looks like you don't have a page selected</div>
  }
  return (
    <div className="page">{page.name}</div>
  );
};

export default Page;