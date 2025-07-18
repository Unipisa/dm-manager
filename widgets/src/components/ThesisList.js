import React from 'react'
import { useQuery } from 'react-query';
import axios from 'axios';
import { getManageURL, getDMURL } from '../utils'
import { Loading } from './Loading';
import Accordion from './Accordion';
import './styles.css';

export function ThesisList({ year, ssd, institution, qualification, _sort, _limit  }) {

    const filter = { year, ssd, _sort, _limit }

    const { isLoading, error, data } = useQuery([ 'theses', filter ], async () => {
        const res = await axios.get(getManageURL("public/theses"), { params: filter })
        return res.data.data
    })

    if (isLoading || error) {
        return <Loading widget="Lista delle tesi" error={error}></Loading>
    }

    let filteredData = data;

    if (institution) {
        filteredData = filteredData.filter(thesis => 
            thesis.institution._id === institution
        );
    }

    if (qualification) {
        filteredData = filteredData.filter(thesis => 
            thesis.person.staff.some(staffItem => staffItem.qualification === qualification)
        );
    }

    const thesesByYear = filteredData.reduce((acc, thesis) => {
        const thesisYear = new Date(thesis.date).getFullYear();
        if (!acc[thesisYear]) {
            acc[thesisYear] = [];
        }
        acc[thesisYear].push(thesis);
        return acc;
    }, {});

    Object.keys(thesesByYear).forEach(year => {
        thesesByYear[year].sort((a, b) => a.person.lastName.localeCompare(b.person.lastName));
    });

    const sortedYears = Object.keys(thesesByYear).sort((a, b) => b - a);

    return (
        <div>
            {sortedYears.map(year => (
                <Accordion title={year} key={year}>
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Title of the Thesis</th>
                                <th>Supervisor(s)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thesesByYear[year].map((thesis) => (
                                <ThesisTableItem key={thesis._id} thesis={thesis} />
                            ))}
                        </tbody>
                    </table>
                </Accordion>
            ))}
        </div>
    )
}

function ThesisTableItem({ thesis }) {
    const supervisors = thesis.advisors.map((advisor, index) => {
        const isUniPisa = advisor.affiliations.some(affiliation => 
            affiliation._id === '6644ab27871112d444fbbc2f'
        );
        
        const name = `${advisor.firstName} ${advisor.lastName}`;
        
        const advisorElement = isUniPisa ? (
            <a href={getDMURL(`en/person-details/?person_id=${advisor._id}`)} key={advisor._id}>
                {name}
            </a>
        ) : (
            <span key={advisor._id}>{name}</span>
        );

        return index < thesis.advisors.length - 1 ? 
            [advisorElement, ', '] : 
            advisorElement;
    });

    return (
        <tr>
            <td>{thesis.person.firstName}</td>
            <td>{thesis.person.lastName}</td>
            <td>{thesis.title}</td>
            <td>{supervisors}</td>
        </tr>
    )
}