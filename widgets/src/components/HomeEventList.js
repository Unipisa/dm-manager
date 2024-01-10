import React from 'react';
import { useState } from 'react';
import Tab from 'react-bootstrap/Tab';
import { Button, Nav } from 'react-bootstrap';
import { useQuery } from 'react-query';
import { Loading } from './Loading';
import axios from 'axios';
import { formatDateInterval, getManageURL, formatDate, formatTime, truncateText } from '../utils';

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

const eventtitle_style = {
    fontSize: "1.2rem"
}

const date_style = {
    fontSize: "0.9rem",
    color: "#003c71"
}

export function HomeEventList({}) {
    const [numberOfEntries, setNumberOfEntries] = useState(4)

    const { isLoading, error, data } = useQuery([ 'homeevents', numberOfEntries ], async () => {
        var events = []
        const now = new Date()

        const conf = await axios.get(getManageURL("public/conferences"), { params: { limits: numberOfEntries, from: now } })
        if (conf.data) {
            const ec = conf.data.data              
            const ec_label =  ec.map(x => { 
                return {...x, type: 'conference'}
            })
            events.push(...ec_label)
        }

        const sem = await axios.get(getManageURL("public/seminars"), { params: { limit: numberOfEntries} })
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
    })

    if (isLoading || error) {
        return <Loading widget="Lista degli eventi" error={error}></Loading>
    }

    const all_event_list = data.map((x) => {
        return <EventBox event={x} key={x._id}></EventBox>
    })

    const button_style = {
        backgroundColor: "#003c71", 
        borderRadius: 0
    }

    return <div className="">
        <Tab.Container id="left-tabs-example" defaultActiveKey="all">
          <Nav variant="pills" className="flex-row d-flex justify-content-center">
            <Nav.Item>
              <Nav.Link eventKey="all" style={button_style}>All</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="second">Seminars</Nav.Link>
            </Nav.Item>
          </Nav>
          <Tab.Content>
            <Tab.Pane eventKey="all">
                <div className="row m-2">
                    {all_event_list}
                </div>
            </Tab.Pane>
            <Tab.Pane eventKey="second">Second tab content</Tab.Pane>
          </Tab.Content>
        </Tab.Container>
        <div className="d-flex flex-row justify-content-center">
            <Button onClick={x => {setNumberOfEntries(numberOfEntries + 4)}}>Load more</Button></div>
    </div>
}

function EventListBox() {
    return <>Ciao</>
}

function EventBox({ event }) {
    console.log(event)

    var date = undefined;
    if (event.endDate) {
        date = formatDateInterval(event.startDate, event.endDate)
    }
    else {
        date = formatDate(event.startDatetime) + " - " + formatTime((event.startDatetime))
    }

    return <div className="col-12 col-md-6 col-lg-4 mb-4 p-5" style={{ height: "300px", overflow: "hidden" }}>
        <h2 className="title entry-title mb-1" style={eventtitle_style}>{truncateText(event.title, 48)}</h2>
        <div style={date_style}>{date}</div>
        <div style={{fontSize: "16px"}}>
            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{truncateText(event.abstract ? event.abstract : event.description, 150)}</Markdown>
        </div>
    </div>
}