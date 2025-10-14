import { useState } from "react";

/**
 * Formats a date to "YYYY-MM-DD HH:mm" or "YYYY-MM-DD" based on a parameter
 * Uses UTC methods to ensure consistent timezone handling (treats all dates as Pisa/Europe time)
 * @type {(date: string | Date, includeTime?: boolean) => string}
 */
export const formatDate = (date, includeTime = true) => {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');

    if (includeTime) {
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } else {
        return `${year}-${month}-${day}`;
    }
}


/**
 * Crea una nuova data partendo da quella fornita e ci imposta la data e
 * l'orario partendo da delle stringhe in formato "yyyy-mm-dd" e "HH:mm".
 * Uses UTC methods to treat all input as Pisa time (avoiding local timezone conversion)
 * 
 * @type {(timeStr: string, date: Date | null | undefined) => Date} updateDatetimeFromString
 */
const updateDatetimeFromString = (dateStr, timeStr, date) => {
    const newDate = date ? new Date(date) : new Date()
    
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, date] = dateStr.split('-').map(s => parseInt(s))
        newDate.setUTCFullYear(year)
        newDate.setUTCMonth(month - 1)
        newDate.setUTCDate(date)
    }

    if (timeStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeStr.split(':').map(s => parseInt(s))
        newDate.setUTCHours(hours)
        newDate.setUTCMinutes(minutes)
        newDate.setUTCSeconds(0)
        newDate.setUTCMilliseconds(0)
    }

    return newDate
}

export function DatetimeInput({ value, setValue }) {
    if (value) value = new Date(value)

    const pad = (v, n) => v.toString().padStart(n, '0');

    const [date, setDate] = useState(value
        ? `${pad(value.getUTCFullYear(), 4)}-${pad(value.getUTCMonth() + 1, 2)}-${pad(value.getUTCDate(), 2)}`
        : ''
    )
    const [time, setTime] = useState(value
        ? `${pad(value.getUTCHours(), 2)}:${pad(value.getUTCMinutes(), 2)}`
        : ''
    )

    return (
        <div className="row d-flex">
            <div className="col-sm-8 pe-0">
                <input
                    type="date"
                    className="form-control"
                    required pattern="\d{4}-\d{2}-\d{2}"
                    value={date}
                    onChange={e => {
                        setDate(e.target.value)
                        setValue(updateDatetimeFromString(e.target.value, null, value))
                    }} />
            </div>
            <div className="col-sm-4">
                <input
                    type="time"
                    className="form-control"
                    required pattern="\d{2}:\d{2}"
                    value={time}
                    onChange={e => {
                        setTime(e.target.value)
                        setValue(updateDatetimeFromString(null, e.target.value, value))
                    }} />
            </div>
        </div>
    )
}


export function DateInput({ id, value, setValue }) {
    return 
}