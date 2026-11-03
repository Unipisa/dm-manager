import React from 'react';
import { getResearchGroupLabel, isEnglish } from '../utils';
import { getDottedField } from '../shortcode-utils';
import './styles.css';

function PeopleCell({ row, field, dateFormat, en }) {
    const value = getDottedField(row, field, dateFormat);
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
        const ssd = getDottedField(row, 'SSD', dateFormat);
        return Array.isArray(ssd) ? ssd.map(code => getResearchGroupLabel(code, en)).join(', ') : (getResearchGroupLabel(ssd, en) ?? '');
    }
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? '1' : '';
    return value == null || typeof value === 'object' ? '' : String(value);
}

export function PeopleTable({
    data, fields = 'cognome', table = false, tableen = false,
    no_data_message = 'nessuna informazione', no_data_message_en = 'there is no data',
    date_format = 'd.m.Y',
}) {
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
                    <td key={column}><PeopleCell row={row} field={field} dateFormat={dateFormat} en={en} /></td>
                ))}</tr>
            ))}</tbody>
        </table>
    );
}
