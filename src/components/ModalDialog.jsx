import { useState } from 'react'

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export function ModalDeleteDialog({ show, objectName, handleClose }) {
    return (
        <ModalConfirmationDialog show={show} 
            title={`Eliminare ${objectName}`}
            body={`Eliminare definitivamente ${objectName}?`}
            handleClose={handleClose}
            primaryText={"Elimina"}
            secondaryText={"Annulla"}
            primaryColor="danger"
        >
        </ModalConfirmationDialog>
    )
}

export function ModalConfirmationDialog({ show, title, body, handleClose, primaryText, primaryColor, secondaryText }) {
    return (
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>{ title }</Modal.Title>
          </Modal.Header>
          <Modal.Body>{ body }</Modal.Body>
          <Modal.Footer>
            { secondaryText && <Button variant="secondary" onClick={x => handleClose(false)}>
              { secondaryText }
            </Button> }
            <Button variant={primaryColor} onClick={x => handleClose(true)}>
              { primaryText }
            </Button>
          </Modal.Footer>
        </Modal>
    );
}

export function ConfirmDeleteButton({className, objectName, onConfirm, children}) {
  const [show, setShow] = useState(false)
  return <>
    <ModalDeleteDialog show={show} objectName={objectName} handleClose={handleClose}/>
    <Button className={className} onClick={() => setShow(true)}>{children}</Button>
  </>

  function handleClose(confirm) {
    if (confirm) onConfirm()
    setShow(false)
  }
}