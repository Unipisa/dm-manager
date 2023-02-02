import { myDateFormat } from '../Engine'

export default function Timestamps({ obj, oa }) {
    oa = oa || 'o'
    return <>
        <p style={{align: "right"}}>
            Creat{oa} da <b>{obj.createdBy?.username || '???'}</b> 
            {' '}il <b>{myDateFormat(obj.createdAt)}</b>
        <br />
            Modificat{oa} da <b>{obj.updatedBy?.username || '???'}</b> 
            {' '}il <b>{myDateFormat(obj.updatedAt)}</b>
        </p>
    </>
}

