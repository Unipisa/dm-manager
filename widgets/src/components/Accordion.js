import React, { useState, useId } from 'react';
import './styles.css';

const Accordion = ({ title, badge, content, markdown = true, initiallyOpen = false, clickToClose = true, autoClose = true, scroll = false, scrollOffset = 0, children }) => {
  const acId = useId();
  const atId = useId();
  const markdownClass = markdown ? 'markdown-compile' : '';

  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const toggleAccordion = () => {
    if (isOpen && !clickToClose) return;
    setIsOpen(!isOpen);
    if (isOpen && scroll) {
      window.scrollTo({
        top: document.getElementById(atId).offsetTop - scrollOffset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className={`wp-block-pb-accordion-item c-accordion__item js-accordion-item ${isOpen ? 'is-open' : ''}`}
      data-initially-open={initiallyOpen}
      data-click-to-close={clickToClose}
      data-auto-close={autoClose}
      data-scroll={scroll}
      data-scroll-offset={scrollOffset}
    >
      <h4
        id={atId}
        className="c-accordion__title js-accordion-controller"
        role="button"
        tabIndex="0"
        aria-controls={acId}
        aria-expanded={isOpen}
        onClick={toggleAccordion}
      >
        <span>{title}</span>
        {badge && <span className="badge badge-primary ml-2">{badge}</span>}
      </h4>
      <div
        id={acId}
        className={`${markdownClass} c-accordion__content`}
        style={{ display: isOpen ? 'block' : 'none' }}
        hidden={!isOpen}
      >
        {content}
        {children}
      </div>
    </div>
  );
};

export default Accordion;