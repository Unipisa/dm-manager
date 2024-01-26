import React, { useState } from 'react';
import { Button, Nav, Tab } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Loading } from './Loading';
import axios from 'axios';
import { formatDateInterval, getManageURL, getDMURL, formatDate, formatTime, truncateText, truncateTextByWords, isEnglish } from '../utils';
import './styles.css';
import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

export function HomeEventList({}) {
    const [numberOfEntries, setNumberOfEntries] = useState(3);

    const { isLoading, error, data } = useQuery([ 'homeevents', numberOfEntries ], async () => {
        var events = []
        const now = new Date()

        const conf = await axios.get(getManageURL("public/conferences"), { params: { _limit: numberOfEntries, _sort: "startDate", from: now} })
        if (conf.data) {
            const ec = conf.data.data              
            const ec_label =  ec.map(x => { 
                return {...x, type: 'conference'}
            })
            events.push(...ec_label)
        }

        const sem = await axios.get(getManageURL("public/seminars"), { params: { _limit: numberOfEntries, _sort: "startDatetime", from: now} })
        if (sem.data) {
            const es = sem.data.data
            const es_label = es.map(x => { 
                return {...x, type: 'seminar'}
            })
            events.push(...es_label)
        }

        events.sort((a, b) => {
            const dateA = a.startDatetime ? a.startDatetime : a.startDate
            const dateB = b.startDatetime ? b.startDatetime : b.startDate
            return new Date(dateA) - new Date(dateB)
        })

        return events
    }, {keepPreviousData: true})

    if (isLoading || error) {
        return <Loading widget="Lista degli eventi" error={error}></Loading>
    }

    const all_event_list = data.map((x) => {
        return <EventBox event={x} key={x._id}></EventBox>
    })

    const seminars = data.filter((event) => event.type === 'seminar');
    const conferences = data.filter((event) => event.type === 'conference');
    const colloquia = data.filter((event) => event.category?.name === 'Colloquium');

    const seminar_list = seminars.map((seminar) => {
        return <EventBox event={seminar} key={seminar._id}></EventBox>;
    });
    const conference_list = conferences.map((conference) => {
        return <EventBox event={conference} key={conference._id}></EventBox>;
    });
    const colloquia_list = colloquia.map((colloquium) => {
        return <EventBox event={colloquium} key={colloquium._id}></EventBox>;
    });

    return <div className="">
        <Tab.Container id="left-tabs-example" defaultActiveKey="all">
          <Nav variant="pills" className="flex-row d-flex justify-content-center">
            <Nav.Item>
              <Nav.Link eventKey="all" className="filter-link">
                {isEnglish() ? "All" : "Tutti"}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="conferences" className="filter-link">
                {isEnglish() ? "Conferences" : "Conferenze"}
              </Nav.Link>
            </Nav.Item>           
            <Nav.Item>
              <Nav.Link eventKey="seminars" className="filter-link">
                {isEnglish() ? "Seminars" : "Seminari"}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="colloquia" className="filter-link">Colloquia</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="all">
                <div className="row">
                    {all_event_list}
                </div>
            </Tab.Pane>
            <Tab.Pane eventKey="conferences">
                <div className="row">
                    {conference_list}    
                </div>
            </Tab.Pane>
            <Tab.Pane eventKey="seminars">
                <div className="row">
                    {seminar_list}    
                </div>
            </Tab.Pane>
            <Tab.Pane eventKey="colloquia">
                <div className="row">
                    {colloquia_list}    
                </div>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
        <div className="d-flex flex-row justify-content-center">
            <Button onClick={x => {setNumberOfEntries(numberOfEntries + 3)}}>
                {isEnglish() ? "Load more" : "Carica altro"}
            </Button></div>
    </div>
}

function EventBox({ event }) {
    var date = undefined;
    var link = undefined;

    if (event.endDate) {
        date = formatDateInterval(event.startDate, event.endDate)
    }
    else {
        date = formatDate(event.startDatetime) + " - " + formatTime((event.startDatetime))
    }

    if (event.type == 'seminar') {
        link = getDMURL("en/seminar?id=" + event._id)
    } 
    else {
        link = getDMURL("en/conference?id=" + event._id)
    }

    return <div className="col-12 col-md-6 col-lg-4 mb-4 p-4" style={{ width: "300px", height: "300px", overflow: "hidden" }}>
        <h2 className="mb-1 title_style">
            <a href={link} className="title_style">{truncateTextByWords(event.title, 20)}</a>
        </h2>
        <div className="date_style far fa-calendar"> {date}</div>
        <div className="excerpt_style">
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateTextByWords(event.abstract ? event.abstract : event.description, 40)}</Markdown>
        </div>
    </div>
}