import { FormGroup, FormLabel, Modal, Button } from 'react-bootstrap'
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef, useId } from 'react';

import { myDateFormat, useEngine } from '../Engine'

export function StringInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <input className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => {setValue(evt.target.value)} }
            />                 
        </div>
    </FormGroup>
}

export function DateInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {myDateFormat(value)}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <UtcDatePicker 
                className="form-control"
                selected={ value ? new Date(value) : null }  
                dateFormat="d.MM.yyyy"
                onChange={ date => setValue(date) } />
        </div>
    </FormGroup>
}

export function ListInput({ label, value, setValue, separator, edit }) {
    const id = useId()
    if (separator === undefined) separator = ','    
    if (!edit) return <p><b>{label}:</b> {value.join(', ')}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>{ label }</FormLabel>
            <div className="col-sm-10">
                <input 
                    id={ id } 
                    value={ value.join(separator) || "" } 
                    onChange={ (evt) => {
                            const val = evt.target.value
                                .split(separator)
                                .map( x => x.trim())
                            setValue(val) 
                        } 
                    }
                    className="form-control" 
                />
        </div>
    </FormGroup>
}

export function TextInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <textarea 
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => setValue(evt.target.value) }
                className="form-control" 
            />
        </div>
    </FormGroup>
}

//
// How to use this input: insert something along the lines of 
//
//  <PersonInput label="Persona" value={person} setValue={setPerson} edit={true}></PersonInput>
//
export function PersonInput({ label, value, setValue, edit }) {
    const [options, setOptions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)
    const typeaheadref = useRef(null)
    const id = useId()

    // Data used for the new person create
    const [newPersonFirstName, setNewPersonFirstName] = useState("");
    const [newPersonLastName, setNewPersonLastName] = useState("");
    const [newPersonAffiliation, setNewPersonAffiliation] = useState("");

    const baseUrl = process.env.REACT_APP_SERVER_URL || ""

    const engine = useEngine()

    const [selected, setSelected] = useState(value ? [value] : [])

    if (! edit) {
        if (!value) return <p><strong>persona: </strong>nessuna selezione</p>
        return <p><strong>persona: </strong>{`${value.firstName} ${value.lastName} (${value.affiliation})`}</p>
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
                setValue(data)
                setSelected([ data ])
                typeaheadref.current.blur()
            })
        })

        setShow(false);
    }

    function onChangeHandler(evt) {
        if (evt.length > 0 && evt[0].newPersonEntry) {
            setNewPersonFirstName("")
            setNewPersonLastName(evt[0].query)
            setNewPersonAffiliation("")

            setShow(true)
            return;
        }

        setSelected(evt)
        if (evt.length > 0) {
            setValue(evt[0])
        }
    }

    const handleSearch = (query) => {
        setIsLoading(true)
       
        engine.get('/api/v0/person/search', {q: query}).then((data) => {
            const searchoptions = data["data"].map(x => {
                return {
                    ...x
                }
            })
            var newoptions = [{ 
                noPersonSelected: true
            }, ...searchoptions ]

            if (searchoptions.length === 0) {
                newoptions = [{
                    newPersonEntry: true,
                    query: query
                }, ...newoptions ]
            }

            setOptions(newoptions)
            setIsLoading(false);
        })   
    }

    const labelDisplayFunction = x => {
        if (x.noPersonSelected) {
            return ""
        }
        return `${x.firstName} ${x.lastName} (${x.affiliation})`
    }

    const menuRenderFunction = x => {
        if (x.newPersonEntry) {
            return <>
                <span className="text-muted">Nuova persona</span> {x.query}
            </>
        }
        if (x.noPersonSelected) {
            return <span className="text-muted">Nessuna persona</span>
        }
        return <span>{labelDisplayFunction(x)}</span>
    }

    const onBlurHandler = x => {
        setSelected(value ? [value] : [])

        if (! value) {
            typeaheadref.current.clear()
        }
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
        <div className="col-sm-10">
        <AsyncTypeahead
          filterBy={filterBy}
          isLoading={isLoading}
          id={ id }
          labelKey={labelDisplayFunction}
          onSearch={handleSearch}
          options={options}
          ref={typeaheadref}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          placeholder="Seleziona una persona..."
          selected={selected}
          renderMenuItemChildren={menuRenderFunction}
        />
        </div>
    </FormGroup>
}
export function SelectInput({ options, label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <FormGroup className="row my-2">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <select className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => setValue(evt.target.value) }>
            { options.map(value => <option value={value}>{ value }</option>)}
            </select>
        </div>
    </FormGroup>
}
