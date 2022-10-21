import { FormGroup, FormLabel } from 'react-bootstrap'

export default function TextInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `textinput-${name}`
    return <FormGroup className="row">
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