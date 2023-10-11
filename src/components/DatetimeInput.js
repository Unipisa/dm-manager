import { useEffect } from "react";

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

    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;

    return formattedDate;
}

function convertUTCToLocalDate(date) {
    if (!date) {
        return date
    }
    date = new Date(date)
    return new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    ))
}

export const normalizeStringDate = (dateString) => {
    return formatDate(convertUTCToLocalDate(dateString))
}

/**
 * Tries to parse a date string in the format "YYYY-MM-DD HH:mm" or throws an
 * error.
 * 
 * @type {(dateString: string) => Date}
 */
export const parseDate = (dateString) => {
    if (!dateString.match(/^\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}$/)) {
        throw new Error('invalid date format, expected "YYYY-MM-DD HH:mm"')
    }

    const [datePart, timePart] = dateString.trim().split(/\s+/g)
    const [year, month, day] = datePart.split('-')
    const [hours, minutes] = timePart.split(':')

    return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1, // months are zero-based
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10)
    )
}

/**
 * Tries to run parseDate and returns true if the parse is successful
 */
export const isValidDate = (dateString) => {
    try {
        parseDate(dateString)
        return true
    } catch (e) {
        return false
    }
}

// TODO: per ora c'è uno "useEffect" per normalizzare il formato della data al
// mount. In teoria il modo migliore di risolvere questo problema sarebbe di
// ricostruire tutti gli oggetti "Date" del json iniziale ricevuto dal server
// ma è noto che il js non rende la cosa facile.
export function DatetimeInput({ id, value, setValue }) {
    // Questo useEffect viene eseguito solo al primo render quindi non
    // servono dipendenze
    useEffect(() => {
        setValue(normalizeStringDate(value))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <input
            type="text"
            className={["form-control", !((value || '').trim().length === 0 || isValidDate(value)) && "is-invalid"].filter(Boolean).join(' ')} 
            id={id}
            value={value ?? ''}
            onChange={e => setValue(e.target.value)}
            placeholder="YYYY-MM-DD HH:mm" />
    )
}