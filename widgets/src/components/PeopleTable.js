import { getPersonProfileURL } from '../person-profile';
import React, { useState } from 'react';
import { getPeopleValue, getPeopleOffice, nextPeopleSort, sortPeopleRows } from '../people-table-utils';
import './styles.css';

// Columns select what to display. The API always returns all approved public fields.
const commonHeadings = {
    name: ['Nome', 'Name'], first_name: ['Nome', 'First name'], last_name: ['Cognome', 'Last name'],
    ssd: ['Gruppo di ricerca', 'Research group'],
    office: ['Ufficio', 'Office'],
    email: ['Email', 'Email'], phone: ['Telefono', 'Phone'], affiliations: ['Affiliazioni', 'Affiliations'],
    start_date: ['Dal', 'From'], end_date: ['Al', 'To'],
};
const headingsByKind = {
    thesis: { name: commonHeadings.name, first_name: commonHeadings.first_name, last_name: commonHeadings.last_name,
        title: ['Titolo della tesi', 'Thesis title'], advisors: ['Relatori', 'Supervisors'],
        institutions: ['Istituzioni', 'Institutions'], date: ['Data', 'Date'], ssd: commonHeadings.ssd,
        genealogy: ['Genealogia', 'Genealogy'], email: commonHeadings.email, phone: commonHeadings.phone, file: ['Tesi', 'Thesis file'] },
    staff: { ...commonHeadings, qualification: ['Qualifica', 'Qualification'], is_internal: ['Interno', 'Internal'] },
    visit: { ...commonHeadings, current_affiliations: ['Affiliazioni attuali', 'Current affiliations'],
        tags: ['Etichette', 'Tags'], publish: ['Pubblica', 'Published'], collaboration_theme: ['Tema della collaborazione', 'Collaboration theme'] },
};
const defaultColumns = {
    thesis: ['name', 'title', 'advisors', 'institutions'],
    staff: ['name', 'qualification', 'ssd', 'office', 'email'],
    visit: ['name', 'affiliations', 'office', 'start_date', 'end_date'],
};

function list(value, option) {
    const entries = typeof value === 'string' ? value.split(',') : value;
    if (!Array.isArray(entries) || entries.some(entry => typeof entry !== 'string')) {
        throw new Error(`${option} must be an array of strings or a comma-separated string.`);
    }
    return entries.map(entry => entry.trim());
}

export function getPeopleTableOptions({ columns, headers = [], headers_en = [], date_style = 'short' } = {}, kind = 'staff') {
    const headings = headingsByKind[kind];
    columns = list(columns === undefined ? defaultColumns[kind] : columns, 'columns');
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
    return { kind, columns, headers, headers_en, date_style };
}

function PeopleCell({ row, column, en, dateFormat, kind }) {
    if (column === 'office') {
        const office = getPeopleOffice(row, en);
        if (!office) return '';
        return <>{office.location}{office.location && office.label ? ', ' : ''}
            {office.url ? <a href={office.url}>{office.label}</a> : office.label}
        </>;
    }
    const person = row.person || {};
    const value = getPeopleValue(row, column, en, kind);
    const profile = getPersonProfileURL(person, en, kind === 'staff' ? [row] : []);
    switch (column) {
        case 'name': {
            return profile ? <a href={profile}><i className="fas fa-id-card fa-fw" aria-hidden="true"></i>{' '}{value}</a> : value;
        }
        case 'advisors': return (row.advisors || []).map((advisor, index) => {
            const url = getPersonProfileURL(advisor, en);
            const name = [advisor.firstName, advisor.lastName].filter(Boolean).join(' ');
            return <React.Fragment key={advisor._id || index}>{index > 0 && ', '}{url ? <a href={url}>{name}</a> : name}</React.Fragment>;
        });
        case 'genealogy': return value ? <a href={`https://www.genealogy.math.ndsu.nodak.edu/id.php?id=${encodeURIComponent(value)}`} aria-label={en ? 'Mathematics Genealogy Project' : 'Progetto di genealogia matematica'}><i className="fas fa-id-card fa-fw" aria-hidden="true"></i></a> : '';
        case 'file': return /^https?:\/\//i.test(value) ? <a href={value} target="_blank" rel="noopener noreferrer">{en ? 'Thesis' : 'Tesi'}</a> : '';
        case 'email': return value ? <a href={`mailto:${value}`}><i className="far fa-envelope fa-fw" aria-hidden="true"></i>{' '}{value}</a> : '';
        case 'phone': return value ? <a href={`tel:${value}`}><i className="fas fa-phone-alt fa-fw" aria-hidden="true"></i>{' '}{value}</a> : '';
        case 'publish':
        case 'is_internal': return value == null ? '' : (value ? (en ? 'Yes' : 'Sì') : 'No');
        case 'date':
        case 'start_date':
        case 'end_date': {
            if (!value) return '';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
        }
        default: return value ?? '';
    }
}

export function PeopleTable({ data, columns, headers, headers_en, date_style, en, kind = 'staff' }) {
    const [sort, setSort] = useState({ column: 'last_name', order: 'asc' });
    const visit = kind === 'visit';
    const thesis = kind === 'thesis';
    const headings = headingsByKind[kind];
    if (!data?.length) return <p>{thesis
        ? (en ? 'No theses match these filters.' : 'Nessuna tesi corrisponde a questi filtri.')
        : visit
        ? (en ? 'No visits match these filters.' : 'Nessuna visita corrisponde a questi filtri.')
        : (en ? 'No staff match these filters.' : 'Nessun membro del personale corrisponde a questi filtri.')}</p>;

    const customHeaders = en && headers_en.length ? headers_en : headers;
    const dateFormat = new Intl.DateTimeFormat(en ? 'en-US' : 'it-IT', { dateStyle: date_style });
    return <div className="dm-people-table-scroll" role="region" aria-label={thesis ? (en ? 'Thesis list' : 'Lista delle tesi') : visit ? (en ? 'Visit list' : 'Lista delle visite') : (en ? 'Staff list' : 'Lista del personale')} tabIndex={0}>
    <table className="peopletable styled-table dm-people-table">
        <thead><tr>{columns.map((column, index) => {
            const label = customHeaders[index] || headings[column][en ? 1 : 0];
            const active = sort.column === column || (sort.column === 'last_name' && !columns.includes('last_name') && column === 'name');
            return <th scope="col" key={column} data-column={column} aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="dm-people-sort" onClick={() => setSort(current => nextPeopleSort(current, column))}>
                    {label}{active && <> <span aria-hidden="true">{sort.order === 'asc' ? '↑' : '↓'}</span></>}
                </button>
            </th>;
        })}</tr></thead>
        <tbody>{sortPeopleRows(data, sort, en, kind).map((row, index) => <tr key={row._id || index}>
            {columns.map(column => <td key={column} data-column={column}><PeopleCell row={row} column={column} en={en} dateFormat={dateFormat} kind={kind} /></td>)}
        </tr>)}</tbody>
    </table>
    </div>;
}
