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
        const current_visits = await axios.get(getManageURL("public/visits"), { 
            params: { _limit: numberOfEntries, _sort: "startDate" } 
        });
            
        const future_visits = await axios.get(getManageURL("public/visits"), { 
            params: { _limit: numberOfEntries, _sort: "startDate", future: true } 
        });
            
        const visits = [
            ...(current_visits.data?.data || []),
            ...(future_visits.data?.data || [])
        ];
                  
        return visits
    }, {keepPreviousData: true})

    if (isLoading || error) {
        return <Loading widget="Lista delle visite" error={error}></Loading>
    }
 
    const current_visit_list = filterVisitsByDate(data, 'current').slice(0, numberOfEntries).map((v) => (
        <VisitTableItems visit={v} key={v._id}></VisitTableItems>
    ));

    const future_visit_list = filterVisitsByDate(data, 'future').slice(0, numberOfEntries).map((v) => (
        <VisitTableItems visit={v} key={v._id}></VisitTableItems>
    ));
        
    const showButton = numberOfEntries <= current_visit_list.length + future_visit_list.length;

    return (
        <div className="">
            <Tab.Container id="left-tabs-example" defaultActiveKey="current">
                <Nav variant="pills" className="flex-row d-flex justify-content-center">
                    <Nav.Item>
                        <Nav.Link eventKey="current" className="filter-link">
                            Current
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="future" className="filter-link">
                            Future
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="current">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Visitor</th>
                                    <th>Period</th>
                                    <th>Office</th>
                                </tr>
                            </thead>
                            <tbody className="">{current_visit_list}</tbody>
                        </table>
                    </Tab.Pane>
                    <Tab.Pane eventKey="future">
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Visitor</th>
                                    <th>Period</th>
                                </tr>
                            </thead>
                            <tbody className="">{future_visit_list}</tbody>
                        </table>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
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

const filterVisitsByDate = (visits, date) => {
    if (date === "current") {
        return visits.filter((visit) => new Date(visit.startDate) <= new Date());
    } else if (date === "future") {
        return visits.filter((visit) => new Date(visit.startDate) > new Date());
    } else {
        return visits;
    }
}

function VisitTableItems({ visit, key }) {
    const date = formatDateInterval(visit.startDate, visit.endDate, 'en-US')
    const roomDetails = visit.roomAssignment ? getRoomDetails(visit.roomAssignment.room, visit.roomAssignment.room._id, true) : '';

    return (
    <tr key={key}>
        <td>{visit.person.firstName} {visit.person.lastName} ({visit.person.affiliations[0]?.name})</td>
        <td>{date}</td>
        {roomDetails && roomDetails !== '' && (new Date(visit.startDate) <= new Date()) && (
          <td>{roomDetails.buildingName}, {roomDetails.floorName}, <a href={roomDetails.roomLink.url}>{roomDetails.roomLink.text}</a></td>
        )}
    </tr>
    )
}