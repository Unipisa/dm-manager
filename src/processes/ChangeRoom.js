
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { SelectPersonBlock } from './SelectPeopleBlock';
import { RoomInput } from '../components/Input';


function ChangeRoomProcess() {
  const [person, setPerson] = useState(null);
  const [newRoom, setNewRoom] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // nessun caricamento stanze qui, RoomInput gestisce tutto

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!person || !person._id) {
      setError('Seleziona una persona.');
      return;
    }
    try {
      if (!newRoom || !newRoom._id) {
        setError('Seleziona una stanza.');
        return;
      }
      const payload = { personId: person._id, newRoomId: newRoom._id };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;
      const res = await axios.post('/process/changeRoom', payload);
      setMessage('Cambio stanza effettuato con successo!');
    } catch (err) {
      setError(err.response?.data?.error || 'Errore nella richiesta.');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Cambia stanza a una persona</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="personSelect">
          <Form.Label>Persona</Form.Label>
          <SelectPersonBlock
            person={person}
            setPerson={setPerson}
            prefix="process/changeRoom"
            canEdit={false}
            canChange={true}
            canCancel={false}
          />
        </Form.Group>
        <Form.Group controlId="roomSelect">
          <Form.Label>Nuova stanza</Form.Label>
          <RoomInput value={newRoom} setValue={setNewRoom} />
        </Form.Group>
        <Form.Group controlId="startDate">
          <Form.Label>Data inizio (opzionale)</Form.Label>
          <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Form.Group>
        <Form.Group controlId="endDate">
          <Form.Label>Data fine (opzionale)</Form.Label>
          <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Form.Group>
        <Button variant="primary" type="submit" className="mt-3">Cambia stanza</Button>
      </Form>
    </div>
  );
}

export default ChangeRoomProcess;
