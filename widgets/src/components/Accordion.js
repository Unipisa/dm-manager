import React, { useState, useId } from 'react';
import './styles.css';

const Accordion = ({ title, content, markdown = true, children }) => {
  const acId = useId();
  const atId = useId();
  const markdownClass = markdown ? 'markdown-compile' : '';

  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  console.log('Accordion', JSON.stringify({ title }));

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
        {children}
      </div>
    </div>
  );
};

export default Accordion;