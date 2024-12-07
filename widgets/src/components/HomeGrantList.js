import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Loading } from './Loading';
import {
  formatDateInterval,
  getManageURL,
  getDMURL,
  formatDate,
  formatTime,
  truncateTextByWords
} from '../utils';
import './styles.css';

export function HomeGrantList({}) {
    const [numberOfEntries, setNumberOfEntries] = useState(6);

    const { isLoading, error, data } = useQuery([ 'homegrants', numberOfEntries ], async () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const grants = await axios.get(getManageURL("public/grants"), { params: { _limit: numberOfEntries, _sort: "-budgetAmount", from: now} })
        if (grants.data) {
            return grants.data.data
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista dei grant" error={error}></Loading>
    }
    
    const all_grant_list = data.slice(0, numberOfEntries).map((x) => (
        <GrantBox grant={x} key={x._id}></GrantBox>
    ));
        
    const showButton = numberOfEntries <= all_grant_list.length;

    return (
        <div className="">
            <div className="row">{all_grant_list}</div>
            {showButton && (
            <div className="d-flex flex-row justify-content-center">
                <Button className="load-button" onClick={() => setNumberOfEntries(numberOfEntries + 3)}>
                {'Load more'}
                </Button>
            </div>
            )}
        </div>
      );
}

function GrantBox({ grant }) {    
    console.log(grant)
    const date = grant.endDate
    ? formatDateInterval(grant.startDate, grant.endDate, 'en-US')
    : `${formatDate(grant.startDatetime)} - ${formatTime(grant.startDatetime)}`;

    const link = getDMURL(`research/grant-details/?grant_id=${grant._id}`);

    var title = grant.name

    return <div className="col-6 col-md-6 col-lg-4 event-box">
        <h2 className="title_style">
            <a href={link} className="title_style">
                {truncateTextByWords(title, 20)}
            </a>
            <small className="text-muted"> ({grant.projectType})</small>
        </h2>
        { grant.pi && grant.pi.firstName &&
          <div className="subtitle_style fas fa-user"> Principal Investigator: {grant.pi.firstName} {grant.pi.lastName} </div> 
        }
        { grant.localCoordinator && grant.localCoordinator.firstName && (grant.localCoordinator._id !== grant.pi._id) &&
          <div className="subtitle_style fas fa-user"> Local Coordinator: {grant.localCoordinator.firstName} {grant.localCoordinator.lastName} </div> 
        }
        <div className="subtitle_style far fa-calendar"> {date}</div>
        <div className="subtitle_style fas fa-coins"> {grant.budgetAmount}</div>
    </div>
}