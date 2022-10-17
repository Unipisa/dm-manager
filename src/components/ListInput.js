export default function ListInput({ name, label, store, setStore, value, separator }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    if (separator === undefined) separator = ','
    const id = `myinput-${name}`
    return <>
    <tr>
        <td style={{text_align: "right"}}>
            <label className="form-label" htmlFor={ id }>{ label }</label>
        </td>
        <td>
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
        </td>
    </tr>
    </>
}