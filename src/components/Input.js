import { FormGroup, FormLabel, Modal, Button, Input, FormText } from 'react-bootstrap'
import ReactDatePicker from "react-datepicker"
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef } from 'react';

import { myDateFormat, useEngine } from '../Engine'

export function StringInput({ name, label, store, setStore, value, edit }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `myinput-${name}`
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <input className="form-control col-sm-10"
                id={ id } 
                name={ name } 
                value={ value || "" } 
                onChange={ (evt) => {
                    setStore(obj => {
                        obj = {...obj}
                        obj[name] = evt.target.value
                        return obj
                    })} 
                }
            />                 
        </div>
    </FormGroup>
}

export function DateInput({ name, label, store, setStore, value, edit }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `dateinput-${name}`
    if (!edit) return <p><b>{label}:</b> {myDateFormat(value)}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <UtcDatePicker 
                className="form-control"
                selected={ value ? new Date(value) : null }  
                dateFormat="d.MM.yyyy"
                onChange={ date => {
                        setStore(obj => {
                            obj = {...obj}
                            obj[name] = date
                            return obj
                        }) 
                    } 
            }/>
        </div>
    </FormGroup>
}

export function ListInput({ name, label, store, setStore, value, separator, edit }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    if (separator === undefined) separator = ','    

    if (!edit) return <p><b>{label}:</b> {value.join(', ')}</p>

    const id = `myinput-${name}`
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>{ label }</FormLabel>
            <div className="col-sm-10">
                <input 
                    id={ id } 
                    name={ name } 
                    value={ value.join(separator) || "" } 
                    onChange={ (evt) => {
                            const val = evt.target.value
                                .split(separator)
                                .map( x => x.trim())
                            setStore(obj => {
                                obj = {...obj}
                                obj[name] = val
                                return obj
                            }) 
                        } 
                    }
                    className="form-control" 
                />
        </div>
    </FormGroup>
}

export function TextInput({ name, label, store, setStore, value, edit }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    if (!edit) return <p><b>{label}:</b> {value}</p>
    const id = `textinput-${name}`
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <textarea 
                id={ id } 
                name={ name } 
                value={ value || "" } 
                onChange={ (evt) => {
                        setStore(obj => {
                            obj = {...obj}
                            obj[name] = evt.target.value
                            return obj
                        }) 
                    } 
                }
                className="form-control" 
            />
        </div>
    </FormGroup>
}

//
// How to use this input: insert something along the lines of 
//
//  <PersonInput name="prova" label="Persona" value={person} setStore={setPerson} edit={true}></PersonInput>
//
export function PersonInput({ name, label, value, store, setStore, edit }) {
    const [options, setOptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false);
    const typeaheadref = useRef(null);

    // Data used for the new person create
    const [newPersonFirstName, setNewPersonFirstName] = useState("");
    const [newPersonLastName, setNewPersonLastName] = useState("");
    const [newPersonAffiliation, setNewPersonAffiliation] = useState("");

    const baseUrl = process.env.REACT_APP_SERVER_URL || ""

    const engine = useEngine()

    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name

    if (! edit) {
        if (!value) return <p>null</p>
        return <p>{`${value.firstName} ${value.lastName} (${value.affiliation})`}</p>
    }

    function handleClose() {
        // Add a new person with the given data
        fetch(baseUrl + "/api/v0/person", {
            credentials: 'include', method: 'PUT', headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, body: JSON.stringify({
                firstName: newPersonFirstName, 
                lastName: newPersonLastName, 
                affiliation: newPersonAffiliation
            })
        }).then(res => {
            res.json().then(data => {                
                setStore(obj => ({
                    ...obj, 
                    [name]: data
                }))
            })
        })

        setShow(false);
    }

    function onChangeHandler(evt) {
        if (evt.length > 0) {
            // This does not correctly update the typeahead component
            setStore(obj => ({
                ...obj,
                [name]: evt[0]
            }))
        }
    }

    const handleSearch = (query) => {
        setIsLoading(true)
        const baseUrl = process.env.REACT_APP_SERVER_URL || ""

        engine.get('/api/v0/person', {lastName__regex: `.*${query}.*`}).then((data) => {
            setOptions(data["data"].map(x => {
                return {
                    // This is just for displaying something reasonable when the 
                    // user selects the right person.
                    display: `${x.firstName} ${x.lastName} (${x.affiliation})`, 
                    ...x
                }
            }))
            setIsLoading(false);
        })
    }

    const labelDisplayFunction = x => {
        return `${x.firstName} ${x.lastName} (${x.affiliation})`        
    }

    const handleNewPersonClick = x => {
        setShow(true);
    }

    const filterBy = () => true

    return <FormGroup className="row">
       <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Crea una nuova persona</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <input className="mb-2 form-control" placeholder='Nome' value={newPersonFirstName} onChange={x => setNewPersonFirstName(x.target.value)}></input>
            <input className="mb-2 form-control" placeholder='Cognome' value={newPersonLastName} onChange={x => setNewPersonLastName(x.target.value)}></input>
            <input className="mb-2 form-control" placeholder='Affiliazione' value={newPersonAffiliation} onChange={x => setNewPersonAffiliation(x.target.value)}></input>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={x => setShow(false)}>
            Annulla
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Salva
          </Button>
        </Modal.Footer>
      </Modal>
       <FormLabel className="col-sm-2">
            { label }
        </FormLabel>
        <div className="col-sm-8">
        <AsyncTypeahead
          filterBy={filterBy}
          isLoading={isLoading}
          id={"typeahead-" + label}
          labelKey={labelDisplayFunction}
          onSearch={handleSearch}
          options={options}
          ref={typeaheadref}
          onChange={onChangeHandler}
          placeholder="Seleziona una persona..."
          value={value}
          renderMenuItemChildren={(option) => (
            <>
              <span>{option.firstName} {option.lastName} ({option.affiliation})</span>
            </>
          )}
        />
        </div>
        <div className="col-sm-2">
            <Button onClick={handleNewPersonClick}>Nuova persona</Button>
        </div>
    </FormGroup>
}
export function SelectInput({ options, name, label, store, setStore, value, edit }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `select-input-${name}`
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <select className="form-control col-sm-10"
                id={ id } 
                name={ name } 
                value={ value || "" } 
                onChange={ (evt) => {
                    setStore(obj => {
                        obj = {...obj}
                        obj[name] = evt.target.value
                        return obj
                    })} 
                }>
            { options.map(value => <option value={value}>{ value }</option>)}
            </select>
        </div>
    </FormGroup>
}
