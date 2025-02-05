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

export function HomeGrantList({ default_entries = 3 }) {
    const [numberOfEntries, setNumberOfEntries] = useState(default_entries * 2);

    const { isLoading, error, data } = useQuery([ 'homegrants', numberOfEntries ], async () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const grants = await axios.get(getManageURL("public/grants"), { params: { from: now} })
        if (grants.data) {
            return grants.data.data
        }
    })

    if (isLoading || error) {
        return <Loading widget="Lista dei grant" error={error}></Loading>
    }
    
    const parseBudgetAmount = (budgetStr) => {
        if (!budgetStr) return -1
        
        const numStr = budgetStr.replace(/^[€$£]|\s/g, '')

        return parseFloat(numStr.replace(/\./g, '').replace(',', '.'))
      };
      
    const all_grant_list = data
        .sort((a, b) => {
            const amountA = parseBudgetAmount(a.budgetAmount)
            const amountB = parseBudgetAmount(b.budgetAmount)
            return amountB - amountA;
        })
        .slice(0, numberOfEntries)
        .map((x) => (
            <GrantBox grant={x} key={x._id}></GrantBox>
    ));
        
    const showButton = numberOfEntries <= all_grant_list.length;

    return (
        <div className="">
            <div className="row">{all_grant_list}</div>
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

function GrantBox({ grant }) {    
    const date = grant.endDate
    ? formatDateInterval(grant.startDate, grant.endDate, 'en-US')
    : `${formatDate(grant.startDate)} - ${formatTime(grant.startDate)}`;

    const link = getDMURL(`research/grant-details/?grant_id=${grant._id}`);

    var title = grant.name

    return <div className="col-6 col-md-6 col-lg-4 grant-box">
        <h2 className="title_style">
            <a href={link} className="title_style">
                {truncateTextByWords(title, 20)}
            </a>
            <small className="text-muted"> ({grant.projectType})</small>
        </h2>
        { grant.pi && grant.pi.firstName && (grant.pi.staff[0]?.isInternal || !grant.localCoordinator) &&
          <div className="subtitle_style fas fa-user"> Principal Investigator: {grant.pi.firstName} {grant.pi.lastName} </div> 
        }
        { grant.localCoordinator && grant.localCoordinator.firstName && (grant.localCoordinator._id !== grant.pi._id) &&
          <div className="subtitle_style fas fa-user"> Local Coordinator: {grant.localCoordinator.firstName} {grant.localCoordinator.lastName} </div> 
        }
        <div className="subtitle_style far fa-calendar"> {date}</div>
        <div className="subtitle_style fas fa-coins"> {grant.budgetAmount}</div>
    </div>
}