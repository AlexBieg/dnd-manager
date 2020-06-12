import React from 'react';
import classNames from 'classnames';
import './Button.scss';


const Button = (props) => <input type="button" {...props} className={classNames('button', props.className)} />

export default Button;