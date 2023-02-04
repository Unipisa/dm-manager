import { myDateFormat } from '../Engine'

export default function Timestamps({ obj, oa }) {
    function username(value) {
        if (value === undefined) return '???'
        if (value === null) return '---'
        return value.username
    }
    oa = oa || 'o'
    return <>
        <p style={{align: "right"}}>
            Creat{oa} da <b>{username(obj.createdBy)}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificat{oa} da <b>{username(obj.updatedBy)}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
    </>
}

