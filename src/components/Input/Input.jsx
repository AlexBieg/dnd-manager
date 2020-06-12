import React from 'react';
import classNames from 'classnames';
import './Input.scss';


const Button = (props) => <input type="text" {...props} className={classNames('input', props.className)} />

export default Button;