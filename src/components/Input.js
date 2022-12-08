import { Form, Modal, Button } from 'react-bootstrap'
import UtcDatePicker from "./UtcDatePicker"
import "react-datepicker/dist/react-datepicker.css"
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import { useState, useRef, useId } from 'react';

import { myDateFormat, useEngine } from '../Engine'

export function StringInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <input className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => {setValue(evt.target.value)} }
            />                 
        </div>
    </Form.Group>
}

export function DateInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {myDateFormat(value)}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <UtcDatePicker 
                className="form-control"
                selected={ value ? new Date(value) : null }  
                dateFormat="d.MM.yyyy"
                onChange={ date => setValue(date) } />
        </div>
    </Form.Group>
}

export function ListInput({ label, value, setValue, separator, edit }) {
    const id = useId()
    if (separator === undefined) separator = ','    
    if (!edit) return <p><b>{label}:</b> {value.join(', ')}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>{ label }</Form.Label>
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
    </Form.Group>
}

export function TextInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <textarea 
                id={ id } 
                value={ value || "" }
                rows={10}
                onChange={ (evt) => setValue(evt.target.value) }
                className="form-control" 
            />
        </div>
    </Form.Group>
}

//
// How to use this input: insert something along the lines of 
//
//  <PersonInput label="Persona" value={person} setValue={setPerson} edit={true}></PersonInput>
//
export function PersonInput({ label, value, setValue, edit, multiple }) {
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

    if (multiple === undefined) {
        multiple = false
    }

    // Determine the value of selected that should be initialized
    const [selected, setSelected] = useState(multiple ? value : (value ? [value] : []))

    const labelDisplayFunction = x => {
        if (!x || x.noPersonSelected || x.newPersonEntry)
            return ""

        return `${x.firstName} ${x.lastName} (${x.affiliation})`
    }

    if (! edit) {
        const values = multiple ? value : [ value ]
        console.log(`value: ${JSON.stringify(value)}`)
        return <p>
            <strong>{ label }: </strong>{Array.from(values).map(labelDisplayFunction).join(", ")}
        </p> 
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
                if (multiple) {
                    setValue([ ...value, data ])
                    setSelected([ ...value, data ])
                }   
                else {       
                    setValue(data)
                    setSelected([ data ])
                }
                typeaheadref.current.blur()
            })
        })

        setShow(false);
    }

    function onChangeHandler(evt) {
        if (evt.length > 0 && evt[evt.length - 1].newPersonEntry) {
            setNewPersonFirstName("")
            setNewPersonLastName(evt[evt.length - 1].query)
            setNewPersonAffiliation("")
            setShow(true)
            return;
        }

        // Filter the entries removing the "No Person selected entries, if any"
        evt = Array.from(evt).filter(x => ! (x.noPersonSelected || x.newPersonEntry))

        setSelected(evt)

        if (evt.length > 0) {
            setValue(multiple ? evt : evt[0])
        }
        else {
            setValue(multiple ? [] : null)
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

            let newoptions = searchoptions

            if (! multiple)
                newoptions = [ { noPersonSelected: true }, ...newoptions ]

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

    const menuRenderFunction = x => {
        if (x.newPersonEntry) {
            return <><span className="text-muted">Nuova persona</span> {x.query}</>
        }
        if (x.noPersonSelected) {
            return <span className="text-muted">Nessuna persona</span>
        }
        return <span>{labelDisplayFunction(x)}</span>
    }

    const onBlurHandler = x => {
        if (multiple) {
            setSelected(value)
        }
        else {
            setSelected(value ? [value] : [])
        }

        if (! value) {
            typeaheadref.current.clear()
        }
    }

    const filterBy = () => true

    return <Form.Group className="row">
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
       <Form.Label className="col-sm-2">
            { label }
        </Form.Label>
        <AsyncTypeahead
          className="col-sm-10"
          filterBy={filterBy}
          isLoading={isLoading}
          id={ id }
          labelKey={labelDisplayFunction}
          onSearch={handleSearch}
          options={options}
          ref={typeaheadref}
          onChange={onChangeHandler}
          onBlur={onBlurHandler}
          placeholder="cognome"
          selected={selected}
          renderMenuItemChildren={menuRenderFunction}
          multiple={multiple}
        />
    </Form.Group>
}

export function SelectInput({ options, label, value, setValue, edit }) {
    const id = useId()
    console.assert(options.includes(value)) 
    if (!edit) return <p><b>{label}:</b> {value}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <select className="form-control col-sm-10"
                id={ id } 
                value={ value || "" } 
                onChange={ (evt) => setValue(evt.target.value) }>
            { options.map(value => <option key={value} value={value}>{ value }</option>)}
            </select>
        </div>
    </Form.Group>
}

export function BooleanInput({ label, value, setValue, edit }) {
    const id = useId()
    if (!edit) return <p><b>{label}:</b> {value?'sì':'no'}</p>
    return <Form.Group className="row my-2">
        <Form.Label className="col-sm-2" htmlFor={ id }>
            { label }</Form.Label>
        <div className="col-sm-10">
            <input className="form-check-input col-sm-10"
                type='checkbox' 
                id={ id } 
                checked={ !!value } 
                onChange={ (evt) => {setValue(!!evt.target.checked)} }
            />                 
        </div>
    </Form.Group>

}