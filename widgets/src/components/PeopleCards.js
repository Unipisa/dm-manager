import React from 'react';
import { PersonCard } from './PersonCard';
import { GroupCards } from './GroupCards';
import { isEnglish } from '../utils';

// Choose one source. Keep each existing view responsible for loading its data.
export function PeopleCards({ person_id, group_id, badge, is_internal }) {
    const en = isEnglish();
    let message;

    if (person_id && group_id) {
        message = en
            ? 'PeopleCards: provide either person_id or group_id, not both.'
            : 'PeopleCards: specificare solo uno tra person_id e group_id, non entrambi.';
    } else if (!person_id && !group_id) {
        message = en
            ? 'PeopleCards: provide a person_id or a group_id.'
            : 'PeopleCards: specificare un person_id oppure un group_id.';
    }

    // Invalid input is shown immediately, before either view makes a request.
    if (message) return <p className="alert alert-danger" role="alert">{message}</p>;

    return person_id
        ? <PersonCard person_id={person_id} badge={badge} />
        : <GroupCards group_id={group_id} is_internal={is_internal} />;
}
