import React, { forwardRef } from 'react';
import classNames from 'classnames';

const Icon = forwardRef(({ icon, ...props }, ref) => {
  return (<i {...props} ref={ref} className={classNames('fas', `fa-${icon}`, props.className)} />);
});

export default Icon;