import React, { useState } from 'react';
import './styles.css';

const createUniqueId = () => 'id-' + Math.random().toString(36).substr(2, 9);

const Accordion = ({ title, content, markdown = true }) => {
  const id = createUniqueId();
  const acId = 'ac-' + id;
  const atId = 'at-' + id;
  const markdownClass = markdown ? 'markdown-compile' : '';

  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="wp-block-pb-accordion-item c-accordion__item js-accordion-item">
      <h4
        id={atId}
        className="c-accordion__title js-accordion-controller"
        role="button"
        tabIndex="0"
        aria-controls={acId}
        aria-expanded={isOpen}
        onClick={toggleAccordion}
      >
        {title}
      </h4>
      <div
        id={acId}
        className={`${markdownClass} c-accordion__content`}
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        {content}
      </div>
    </div>
  );
};

export default Accordion;