import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL, getResearchGroupLabel, isEnglish } from '../utils';
import './styles.css';

export function getVisitQuery(filter, sortField) {
    const params = new URLSearchParams({ _sort: sortField });
    for (const part of filter.split(',')) {
        const entry = part.trim();
        if (!entry) continue;
        const separator = entry.indexOf('=');
        const key = separator < 0 ? entry : entry.slice(0, separator);
        const value = separator < 0 ? '' : entry.slice(separator + 1);
        switch (key) {
            case 'current':
                params.set('startDate__lte_or_null', 'today');
                params.set('endDate__gte_or_null', 'today');
                break;
            case 'past':
                params.set('endDate__lt', 'today');
                break;
            case 'perspective':
                params.set('startDate__gt', 'today');
                break;
            case 'year':
                params.set('startDate__lte_or_null', `${value}-12-31`);
                params.set('endDate__gte_or_null', `${value}-01-01`);
                break;
            case 'dateyear':
                params.set('date__lte', `${value}-12-31`);
                params.set('date__gte', `${value}-01-01`);
                break;
            default:
                params.set(key, value);
        }
    }
    return params.toString();
}

export function getVisitField(row, field, dateFormat) {
    const value = field.split('.').reduce((object, key) => object?.[key], row);
    if (!['startDate', 'endDate', 'date'].includes(field)) return value;

    // PHP date_create() uses the current date for an empty value.
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const pad = number => String(number).padStart(2, '0');
    const tokens = {
        Y: date.getFullYear(), y: String(date.getFullYear()).slice(-2),
        m: pad(date.getMonth() + 1), n: date.getMonth() + 1,
        d: pad(date.getDate()), j: date.getDate(),
        M: date.toLocaleDateString('en-US', { month: 'short' }),
        F: date.toLocaleDateString('en-US', { month: 'long' }),
        D: date.toLocaleDateString('en-US', { weekday: 'short' }),
        l: date.toLocaleDateString('en-US', { weekday: 'long' }),
        H: pad(date.getHours()), G: date.getHours(),
        i: pad(date.getMinutes()), s: pad(date.getSeconds()),
    };
    return dateFormat.replace(/\\(.)|[YymndjMFDlHGis]/g, (token, escaped) => escaped ?? tokens[token]);
}

function VisitCell({ row, field, dateFormat, en }) {
    const value = getVisitField(row, field, dateFormat);
    if (field === 'building' || field === 'roomAssignment.room.building') {
        if (value === 'A') return en ? 'Building A' : 'Edificio A';
        if (value === 'B') return en ? 'Building B' : 'Edificio B';
        if (value === 'X') return 'ex DMA';
        return value ?? '';
    }
    if (field === 'roomNumber') return String(value ?? '').replaceAll('Piano', 'Floor');
    if (field === 'roomAssignment.room.floor') {
        const floors = en ? ['Ground floor', 'First floor', 'Second floor'] : ['Piano terra', 'Primo piano', 'Secondo piano'];
        return ['0', '1', '2'].includes(String(value)) ? floors[Number(value)] : (value ?? '');
    }
    if (field === 'person.email' && value) {
        return <a href={`mailto:${value}`}><i className="far fa-envelope fa-fw"></i><span className="d-none d-lg-inline">{value}</span></a>;
    }
    if (field === 'person.phone' && value) {
        return <a href={`tel:${value}`}><i className="fas fa-phone-alt fa-fw"></i>{' '}<span className="d-none d-lg-inline">{value}</span></a>;
    }
    if (field === 'person._id') {
        return <a href={`${en ? '/en' : ''}/scheda-personale/?person_id=${value ?? ''}`}><i className="fas fa-id-card fa-fw"></i></a>;
    }
    if (field === 'affiliations' || field === 'person.affiliations') {
        return Array.isArray(value) ? value.map(affiliation => affiliation.name).join(', ') : '';
    }
    if (field === 'SSD_name') {
        const ssd = getVisitField(row, 'SSD', dateFormat);
        return Array.isArray(ssd) ? ssd.map(code => getResearchGroupLabel(code, en)).join(', ') : (getResearchGroupLabel(ssd, en) ?? '');
    }
    if (Array.isArray(value)) return value.join(', ');
    return value == null || typeof value === 'object' ? '' : String(value);
}

export function VisitList({
    fields = 'cognome', table = false, tableen = false,
    sort_field = 'person', filter = '',
    no_data_message = 'nessuna informazione', no_data_message_en = 'there is no data',
    date_format = 'd.m.Y',
}) {
    const query = getVisitQuery(filter, sort_field);
    const { isLoading, error, data } = useQuery(['visitlist', query], async () => {
        const res = await axios.get(getManageURL('public/visit-list', query));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista delle visite" error={error} />;

    const en = isEnglish();
    if (!data?.length) return <p>{en ? no_data_message_en : no_data_message}</p>;

    const columns = fields.split(',').map(field => field.trim());
    const headings = String((en && tableen ? tableen : table) || '').split(',');
    const dateFormat = en ? 'M d, Y' : date_format;

    return (
        <table className="peopletable styled-table">
            <thead><tr>{columns.map((field, index) => (
                <th key={index} className={['person.lastName', 'qualification'].includes(field) ? 'enable-sort' : undefined}>{headings[index] || ''}</th>
            ))}</tr></thead>
            <tbody>{data.map((row, index) => (
                <tr key={row._id || index}>{columns.map((field, column) => (
                    <td key={column}><VisitCell row={row} field={field} dateFormat={dateFormat} en={en} /></td>
                ))}</tr>
            ))}</tbody>
        </table>
    );
}
