import React, { useState } from 'react';
import { getStaffValue, nextStaffSort, sortStaffRows } from '../staff-table-utils';
import './styles.css';

// Columns select what to display. The API always returns all approved public fields.
const headings = {
    name: ['Nome', 'Name'], first_name: ['Nome', 'First name'], last_name: ['Cognome', 'Last name'],
    qualification: ['Qualifica', 'Qualification'], ssd: ['Gruppo di ricerca', 'Research group'],
    building: ['Edificio', 'Building'], floor: ['Piano', 'Floor'], office: ['Stanza', 'Office'],
    email: ['Email', 'Email'], phone: ['Telefono', 'Phone'], affiliations: ['Affiliazioni', 'Affiliations'],
    start_date: ['Dal', 'From'], end_date: ['Al', 'To'], is_internal: ['Interno', 'Internal'],
};
const defaultColumns = ['name', 'qualification', 'ssd', 'building', 'floor', 'office', 'email'];

function list(value, option) {
    const entries = typeof value === 'string' ? value.split(',') : value;
    if (!Array.isArray(entries) || entries.some(entry => typeof entry !== 'string')) {
        throw new Error(`${option} must be an array of strings or a comma-separated string.`);
    }
    return entries.map(entry => entry.trim());
}

export function getStaffTableOptions({ columns = defaultColumns, headers = [], headers_en = [], date_style = 'short' } = {}) {
    columns = list(columns, 'columns');
    if (!columns.length || columns.some(column => !Object.hasOwn(headings, column))) {
        throw new Error(`columns must contain names from: ${Object.keys(headings).join(', ')}.`);
    }
    if (new Set(columns).size !== columns.length) throw new Error('columns must not contain duplicates.');
    headers = list(headers, 'headers');
    headers_en = list(headers_en, 'headers_en');
    for (const values of [headers, headers_en]) {
        if (values.length && values.length !== columns.length) throw new Error('headers and headers_en must match the number of columns.');
    }
    if (!['short', 'medium', 'long', 'full'].includes(date_style)) throw new Error('date_style must be short, medium, long or full.');
    return { columns, headers, headers_en, date_style };
}

function StaffCell({ row, column, en, dateFormat }) {
    const person = row.person || {};
    const value = getStaffValue(row, column, en);
    const profile = person._id ? `${en ? '/en' : ''}/scheda-personale/?person_id=${person._id}` : null;
    switch (column) {
        case 'name': {
            return profile ? <a href={profile}><i className="fas fa-id-card fa-fw" aria-hidden="true"></i>{' '}{value}</a> : value;
        }
        case 'email': return value ? <a href={`mailto:${value}`}><i className="far fa-envelope fa-fw" aria-hidden="true"></i>{' '}{value}</a> : '';
        case 'phone': return value ? <a href={`tel:${value}`}><i className="fas fa-phone-alt fa-fw" aria-hidden="true"></i>{' '}{value}</a> : '';
        case 'is_internal': return value == null ? '' : (value ? (en ? 'Yes' : 'Sì') : 'No');
        case 'start_date':
        case 'end_date': {
            if (!value) return '';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
        }
        default: return value ?? '';
    }
}

export function StaffTable({ data, columns, headers, headers_en, date_style, en }) {
    const [sort, setSort] = useState({ column: 'last_name', order: 'asc' });
    if (!data?.length) return <p>{en ? 'No staff match these filters.' : 'Nessun membro del personale corrisponde a questi filtri.'}</p>;

    const customHeaders = en && headers_en.length ? headers_en : headers;
    const dateFormat = new Intl.DateTimeFormat(en ? 'en-US' : 'it-IT', { dateStyle: date_style });
    return <div className="dm-staff-table-scroll" role="region" aria-label={en ? 'Staff list' : 'Lista del personale'} tabIndex={0}>
    <table className="peopletable styled-table dm-staff-table">
        <thead><tr>{columns.map((column, index) => {
            const label = customHeaders[index] || headings[column][en ? 1 : 0];
            const active = sort.column === column || (sort.column === 'last_name' && !columns.includes('last_name') && column === 'name');
            return <th scope="col" key={column} data-column={column} aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="dm-staff-sort" onClick={() => setSort(current => nextStaffSort(current, column))}>
                    {label}{active && <> <span aria-hidden="true">{sort.order === 'asc' ? '↑' : '↓'}</span></>}
                </button>
            </th>;
        })}</tr></thead>
        <tbody>{sortStaffRows(data, sort, en).map((row, index) => <tr key={row._id || index}>
            {columns.map(column => <td key={column} data-column={column}><StaffCell row={row} column={column} en={en} dateFormat={dateFormat} /></td>)}
        </tr>)}</tbody>
    </table>
    </div>;
}
