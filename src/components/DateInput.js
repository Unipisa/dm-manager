import { FormGroup, FormLabel } from 'react-bootstrap'
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

export default function DateInput({ name, label, store, setStore, value }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `dateinput-${name}`
    return <FormGroup className="row">
        <FormLabel className="col-sm-2" htmlFor={ id }>
            { label }</FormLabel>
        <div className="col-sm-10">
            <ReactDatePicker 
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