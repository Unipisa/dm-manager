import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import { getManageURL, isEnglish } from '../utils';
import { getShortcodeQuery, getDottedField } from '../shortcode-utils';
import './styles.css';

function ThesisCell({ row, field, dateFormat }) {
    const value = getDottedField(row, field, dateFormat);
    if (field === 'person.genealogyId') {
        return value ? <a href={`https://www.genealogy.math.ndsu.nodak.edu/id.php?id=${value}`}><span className="fas fa-id-card fa-fw" aria-hidden="true"></span></a> : null;
    }
    if (field === 'person.email' && value) {
        return <a href={`mailto:${value}`}><i className="far fa-envelope fa-fw"></i><span className="d-none d-lg-inline">{value}</span></a>;
    }
    if (field === 'person.phone' && value) {
        return <a href={`tel:${value}`}><i className="fas fa-phone-alt fa-fw"></i>{' '}<span className="d-none d-lg-inline">{value}</span></a>;
    }
    if (field === 'person._id') {
        return <a href={`/scheda-personale/?person_id=${value ?? ''}`}><i className="fas fa-id-card fa-fw"></i></a>;
    }
    if (field === 'advisors') {
        return (value || []).map((advisor, index) => {
            const internal = Array.isArray(advisor.staffs) && advisor.staffs[0]?.isInternal;
            const name = `${advisor.firstName}  ${advisor.lastName}`;
            return <React.Fragment key={advisor._id || index}>
                {index > 0 && ' and '}
                {internal ? <a href={`/en/scheda-personale/?person_id=${advisor._id}`}>{name}</a> : name}
            </React.Fragment>;
        });
    }
    if (field === 'institutions') {
        return Array.isArray(value) ? value.filter(institution => institution.name != null).map(institution => institution.name).join(', ') : '';
    }
    if (Array.isArray(value)) return value.join(', ');
    return value == null || typeof value === 'object' ? '' : String(value);
}

export function ThesisTable({
    fields = 'person.firstName,person.lastName,person.genealogyId',
    table = false, tableen = false, sort_field = 'person', filter = '',
    no_data_message = 'nessuna informazione', no_data_message_en = 'there is no data',
    date_format = false, list_mode = false,
}) {
    const query = getShortcodeQuery(filter, sort_field);
    const { isLoading, error, data } = useQuery(['thesis-shortcode', query], async () => {
        const res = await axios.get(getManageURL('public/theses', `_format=shortcode&${query}`));
        return res.data.data || [];
    });

    if (isLoading || error) return <Loading widget="Lista delle tesi" error={error} />;

    const en = isEnglish();
    if (!data?.length) return <p>{en ? no_data_message_en : no_data_message}</p>;

    // PHP shortcode attributes are strings: "0" is false, while "false" is true.
    const listMode = !!list_mode && list_mode !== '0';
    if (listMode) {
        return <ul>{data.map((row, index) => (
            <li key={row._id || index}>
                {row.person?.firstName} {row.person?.lastName}
                {row.affiliation && ` (${row.affiliation.name})`}
                {row.title && ` "${row.title}"`}
                {row.advisors?.length > 0 && ` supervised by ${row.advisors.map(advisor => `${advisor.firstName}  ${advisor.lastName}`).join(' and ')}`}
            </li>
        ))}</ul>;
    }

    const columns = fields.split(',').map(field => field.trim());
    const headings = String((en && tableen ? tableen : table) || '').split(',');
    const dateFormat = date_format || (en ? 'M d, Y' : 'd.m.Y');
    return (
        <table className="styled-table">
            <thead><tr>{columns.map((field, index) => (
                <th key={index} className={['person.lastName', 'qualification'].includes(field) ? 'enable-sort' : undefined}>{headings[index] || ''}</th>
            ))}</tr></thead>
            <tbody>{data.map((row, index) => (
                <tr key={row._id || index}>{columns.map((field, column) => (
                    <td key={column}><ThesisCell row={row} field={field} dateFormat={dateFormat} /></td>
                ))}</tr>
            ))}</tbody>
        </table>
    );
}
