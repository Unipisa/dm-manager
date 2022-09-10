export default function MyInput({ name, label, store, value, onChange }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `myinput-${name}`
    return <>
        <input id={ id } name={ name } value={ store[name] } onChange={ onChange } className="form-control" />
        <label className="form-label" htmlFor={ id }>{ label }</label>
        </>
}