import React, { useState } from 'react';
import { Button, Nav, Tab } from 'react-bootstrap';
import { useQuery } from 'react-query';
import axios from 'axios';
import Markdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { Loading } from './Loading';
import {
  formatDateInterval,
  getManageURL,
  getDMURL,
  formatDate,
  formatTime,
  truncateTextByWords,
  isEnglish
} from '../utils';
import './styles.css';

export function HomeEventList({}) {
    const [numberOfEntries, setNumberOfEntries] = useState(6);

    const { isLoading, error, data } = useQuery([ 'homeevents', numberOfEntries ], async () => {
        var events = {}
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const conf = await axios.get(getManageURL("public/conferences"), { params: { _limit: numberOfEntries, _sort: "startDate", from: now} })
        if (conf.data) {
            for (const e of conf.data.data) {
              console.log(`Conference: ${e._id}`,e)
              events[e._id] = {...e, type: 'conference'}
            }
        }

        const sem = await axios.get(getManageURL("public/seminars"), { params: { _limit: numberOfEntries, _sort: "startDatetime", from: now} })
        if (sem.data) {
            for (const e of sem.data.data) {
              events[e._id] = {...e, type: 'seminar'}
            }
        }

        //colloquium category develop: 65b385d88d78f383a820e974
        //colloquim category production: 653b522f8f0af760bdc42723
        const coll = await axios.get(getManageURL("public/seminars"), { params: { _limit: numberOfEntries, _sort: "startDatetime", category: "653b522f8f0af760bdc42723", from: now} })
        if (coll.data) {
            for (const e of coll.data.data) {
              events[e._id] = {...e, type: 'seminar'}
            }
        }
        
        events = Object.values(events)

        events.sort((a, b) => {
          const dateA = a.startDatetime ? a.startDatetime : a.startDate
          const dateB = b.startDatetime ? b.startDatetime : b.startDate
          return new Date(dateA) - new Date(dateB)
        })
        
        // events = events.slice(0, Math.max(numberOfEntries, Math.floor(events.length / 3) * 3))

        return events
    }, {keepPreviousData: true})

    if (isLoading || error) {
        return <Loading widget="Lista degli eventi" error={error}></Loading>
    }

      const all_event_list = data.slice(0, numberOfEntries).map((x) => (
        <EventBox event={x} key={x._id}></EventBox>
      ));
    
      const seminar_list = filterEventsByType(data, 'seminar').slice(0, numberOfEntries).map((seminar) => (
        <EventBox event={seminar} key={seminar._id}></EventBox>
      ));
    
      const conference_list = filterEventsByType(data, 'conference').slice(0, numberOfEntries).map(
        (conference) => (
          <EventBox event={conference} key={conference._id}></EventBox>
        )
      );
    
      const colloquia_list = filterEventsByCategory(data, 'Colloquium').slice(0,numberOfEntries).map(
        (colloquium) => (
          <EventBox event={colloquium} key={colloquium._id}></EventBox>
        )
      );
      
      const showButton = numberOfEntries <= seminar_list.length + conference_list.length ;

      return (
        <div className="">
          <Tab.Container id="left-tabs-example" defaultActiveKey="all">
            <Nav variant="pills" className="flex-row d-flex justify-content-center">
              <Nav.Item>
                <Nav.Link eventKey="all" className="filter-link">
                  {isEnglish() ? 'All' : 'Tutti'}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="conferences" className="filter-link">
                  {isEnglish() ? 'Conferences' : 'Conferenze'}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="seminars" className="filter-link">
                  {isEnglish() ? 'Seminars' : 'Seminari'}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="colloquia" className="filter-link">
                  Colloquia
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content>
              <Tab.Pane eventKey="all">
                <div className="row">{all_event_list}</div>
              </Tab.Pane>
              <Tab.Pane eventKey="conferences">
                <div className="row">{conference_list}</div>
              </Tab.Pane>
              <Tab.Pane eventKey="seminars">
                <div className="row">{seminar_list}</div>
              </Tab.Pane>
              <Tab.Pane eventKey="colloquia">
                <div className="row">{colloquia_list}</div>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
          {showButton && (
          <div className="d-flex flex-row justify-content-center">
            <Button className="load-button" onClick={() => setNumberOfEntries(numberOfEntries + 3)}>
              {isEnglish() ? 'Load more' : 'Carica altro'}
            </Button>
          </div>
          )}
        </div>
      );
}

function filterEventsByType(events, type) {
    return events.filter((event) => event.type === type);
  }
  
  function filterEventsByCategory(events, category) {
    return events.filter((event) => event.category?.name === category);
  }

function EventBox({ event }) {    
    const date = event.endDate
    ? formatDateInterval(event.startDate, event.endDate)
    : `${formatDate(event.startDatetime)} - ${formatTime(event.startDatetime)}`;

    const link = event.type === 'seminar' ? getDMURL(`en/seminar?id=${event._id}`) : getDMURL(`en/conference?id=${event._id}`);

    let tags;

    if (event.type === "seminar") {
      tags = [
        <a href={getDMURL("en/seminars")} key="seminars-category">Seminars</a>
      ];
    
      if (event.category !== undefined) {
        const link = getDMURL(`en/seminars/?category=${event.category._id}`);
        tags.push(
          <span key={event.category._id}>
            , <a href={link}>{event.category.name}</a>
          </span>
        );
      }
    } else {
      tags = <a href={event.url}>{isEnglish() ? 'Website' : 'Sito web'}</a>
    }

    var title = event.title

    if (event.category?.label === 'phd-thesis-defense') {
      title = `Ph.D. Thesis Defense: ${title}`
    }

    return <div className="col-6 col-md-6 col-lg-4 event-box">
        <h2 className="title_style">
            <a href={link} className="title_style">
                {truncateTextByWords(title, 20)}
            </a>
        </h2>
        { event.speakers && 
          <div className="subtitle_style fas fa-user"> {event.speakers.map(speaker => `${speaker.firstName || ''} ${speaker.lastName || ''}`).join(', ')}</div> 
        }
        <div className="subtitle_style far fa-calendar"> {date}</div>
        <div className="subtitle_style fas fa-map-marker-alt"> {event.conferenceRoom?.name || event.institution?.name}</div>
        <div className={`subtitle_style ${event.type === 'seminar' ? 'fa fa-tags' : event.type === 'conference' ? 'fa fa-link' : ''}`}> {tags}</div>
        <div className="excerpt_style">
            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {truncateTextByWords(event.abstract ? event.abstract : event.description, 30)}
            </Markdown>
        </div>
    </div>
}