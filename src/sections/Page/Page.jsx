import React from 'react';
import { getActivePage } from 'reducers/pages';
import { useSelector } from 'react-redux';

import './Page.scss';

const Page = () => {
  const page = useSelector(getActivePage);
  if (!page) {
    return <div>Looks like you don't have a page selected</div>
  }
  return (
    <div className="page">{page.name}</div>
  );
};

export default Page;