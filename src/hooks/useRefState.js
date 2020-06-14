import { useState, useRef, useEffect } from 'react';

const useRefState = (initialValue) => {
  const [state, _setState] = useState(initialValue);
  const stateRef = useRef(state);

  const setState = (d) => {
    stateRef.current = d;
    _setState(d)
  }

  return [stateRef, setState];
};

export default useRefState;