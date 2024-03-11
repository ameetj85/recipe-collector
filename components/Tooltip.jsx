import React, { useState } from 'react';

const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className='position: absolute; right: 20px;
  background-color: black;
  color: white;
  padding: 5px;
  border-radius: 5px;
  opacity: 0;
  transition: opacity 1s;
  top: 0;
  left: 80px;
  width: max-content;'
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className='position: relative'>{text}</div>}
    </div>
  );
};

export default Tooltip;
