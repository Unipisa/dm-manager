export default function MyInput({ name, label, store, value, onChange }) {
    if (value === undefined && store!==undefined) value = store[name]
    if (label === undefined) label = name
    const id = `myinput-${name}`
    return <>
    <tr>
        <td style={{text_align: "right"}}>
            <label className="form-label" htmlFor={ id }>{ label }</label>
        </td>
        <td>
            <input id={ id } name={ name } value={ value || "" } onChange={ onChange } className="form-control" />
        </td>
    </tr>
    </>
}