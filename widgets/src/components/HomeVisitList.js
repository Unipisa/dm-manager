import React, { useState } from 'react';
import { Button, Nav, Tab } from 'react-bootstrap';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import {
  formatDateInterval,
  getManageURL,
  getRoomDetails
} from '../utils';
import './styles.css';

export function HomeVisitList({ default_entries = 10 }) {
    const [numberOfEntries, setNumberOfEntries] = useState(default_entries)

    const { isLoading, error, data } = useQuery([ 'homevisits', numberOfEntries ], async () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const visits = await axios.get(getManageURL("public/visits"), { params: { _limit: numberOfEntries, _sort: "startDate", from: '2024-01-01'} })
        if (visits.data) {
            return visits.data.data
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista delle visite" error={error}></Loading>
    }
    
    const all_visit_list = data.slice(0, numberOfEntries).map((v) => (
        <VisitTableItems visit={v} key={v._id}></VisitTableItems>
    ));
        
    const showButton = numberOfEntries <= all_visit_list.length;

    return (
        <div className="">
            <table className="styled-table">
                <thead>
                    <tr>
                        <th>Visitor</th>
                        <th>Period</th>
                        <th>Office</th>
                    </tr>
                </thead>
                <tbody className="">{all_visit_list}</tbody>
            </table>
            {showButton && (
            <div className="d-flex flex-row justify-content-center">
                <Button className="load-button" onClick={() => setNumberOfEntries(numberOfEntries + default_entries)}>
                {'Load more'}
                </Button>
            </div>
            )}
        </div>
      );
}

function VisitTableItems({ visit, key }) {
    const date = formatDateInterval(visit.startDate, visit.endDate, 'en-US')
    const roomDetails = visit.roomAssignment ? getRoomDetails(visit.roomAssignment.room, '', true) : '';

    return (
    <tr key={key}>
        <td>{visit.person.firstName} {visit.person.lastName} ({visit.person.affiliations[0]?.name})</td>
        <td>{date}</td>
        {roomDetails && roomDetails !== '' && (
          <td>{roomDetails.buildingName}, {roomDetails.floorName}, {roomDetails.roomLink.text}</td>
        )}
    </tr>
    )
}