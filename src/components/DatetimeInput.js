import { useState } from "react";

/**
 * Formats a date to "YYYY-MM-DD HH:mm"
 * @type {(date: string | Date) => string}
 */
export const formatDate = (date) => {
    if (!date) return ''
    if (typeof date === 'string') date = new Date(date)

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

    return formattedDate;
}


/**
 * Crea una nuova data partendo da quella fornita e ci imposta la data e
 * l'orario partendo da delle stringhe in formato "yyyy-mm-dd" e "HH:mm".
 * 
 * @type {(timeStr: string, date: Date | null | undefined) => Date} updateDatetimeFromString
 */
const updateDatetimeFromString = (dateStr, timeStr, date) => {
    const newDate = date ? new Date(date) : new Date()
    
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, date] = dateStr.split('-').map(s => parseInt(s))
        newDate.setFullYear(year)
        newDate.setMonth(month - 1)
        newDate.setDate(date)
    }

    if (timeStr && timeStr.match(/^\d{2}:\d{2}$/)) {
        const [hours, minutes] = timeStr.split(':').map(s => parseInt(s))
        newDate.setHours(hours)
        newDate.setMinutes(minutes)
        newDate.setSeconds(0)
        newDate.setMilliseconds(0)
    }

    return newDate
}

export function DatetimeInput({ value, setValue }) {
    if (value) value = new Date(value)

    const [date, setDate] = useState(value 
        ? `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}` 
        : ''
    )
    const [time, setTime] = useState(value 
        ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
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