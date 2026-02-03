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

export function HomeEventList({ default_entries = 3, show_excerpt = true, en = false }) {
    const [numberOfEntries, setNumberOfEntries] = useState(default_entries * 2);

    const { isLoading, error, data } = useQuery([ 'homeevents', numberOfEntries ], async () => {
        var events = {}
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const conf = await axios.get(getManageURL("public/conferences"), { params: { _limit: numberOfEntries, _sort: "startDate", from: now} })
        if (conf.data) {
            for (const e of conf.data.data) {
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
        <EventBox event={x} key={x._id} show_excerpt={show_excerpt} en={en}></EventBox>
    ));
    
    const seminar_list = filterEventsByType(data, 'seminar').slice(0, numberOfEntries).map((seminar) => (
        <EventBox event={seminar} key={seminar._id} show_excerpt={show_excerpt} en={en}></EventBox>
    ));
    
    const conference_list = filterEventsByType(data, 'conference').slice(0, numberOfEntries).map(
        (conference) => (
          <EventBox event={conference} key={conference._id} show_excerpt={show_excerpt} en={en}></EventBox>
        )
    );
    
    const colloquia_list = filterEventsByCategory(data, 'Colloquium').slice(0,numberOfEntries).map(
        (colloquium) => (
          <EventBox event={colloquium} key={colloquium._id} show_excerpt={show_excerpt} en={en}></EventBox>
        )
    );
      
    const showButton = numberOfEntries <= seminar_list.length + conference_list.length;

    return (
        <div className="">
          <Tab.Container id="left-tabs-example" defaultActiveKey="all">
            <Nav variant="pills" className="flex-row d-flex justify-content-center">
              <Nav.Item>
                <Nav.Link eventKey="all" className="filter-link">
                  {isEnglish(en) ? 'All' : 'Tutti'}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="conferences" className="filter-link">
                  {isEnglish(en) ? 'Conferences' : 'Conferenze'}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="seminars" className="filter-link">
                  {isEnglish(en) ? 'Seminars' : 'Seminari'}
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
            <Button className="load-button" onClick={() => setNumberOfEntries(numberOfEntries + default_entries)}>
              {isEnglish(en) ? 'Load more' : 'Carica altro'}
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

function EventBox({ event, show_excerpt, en }) {    
    const date = event.endDate
    ? formatDateInterval(event.startDate, event.endDate)
    : `${formatDate(event.startDatetime)} - ${formatTime(event.startDatetime)}`;

    const link = event.type === 'seminar' 
        ? getDMURL(isEnglish(en) ? `en/seminar?id=${event._id}` : `seminario?id=${event._id}`) 
        : getDMURL(isEnglish(en) ? `en/conference?id=${event._id}` : `conferenza?id=${event._id}`);

    let tags;

    if (event.type === "seminar") {
      tags = [
        <a href={getDMURL(isEnglish(en) ? "en/seminars" : "prossimi-seminari")} key="seminars-category">Seminars</a>
      ];
    
      if (event.category !== undefined && event.category.length > 0) {
        event.category.forEach(cat => {
          const link = getDMURL(isEnglish(en) ? `en/seminars/?category=${cat._id}` : `prossimi-seminari/?category=${cat._id}`);
          tags.push(
            <span key={cat._id}>
              , <a href={link}>{cat.name}</a>
            </span>
          );
        });
      }
    } else {
      tags = <a href={event.url}>{isEnglish(en) ? 'Website' : 'Sito web'}</a>
    }

    var title = event.title

    if (event.category?.some(cat => cat.label === 'phd-thesis-defense')) {
      title = `Ph.D. Thesis Defense: ${title}`
    }

    let room = null;
    
    if (event.conferenceRoom?.name) {
        if (event.conferenceRoom?.room) {
            const roomUrl = en
                ? getDMURL(`/map?sel=${event.conferenceRoom.room}`)
                : getDMURL(`/mappa?sel=${event.conferenceRoom.room}`);
            room = <a href={roomUrl}>{event.conferenceRoom.name}</a>;
        } else {
            room = event.conferenceRoom.name;
        }
    } else if (event.institution?.name) {
        room = event.institution.name;
    }

    return <div className={`col-6 col-md-6 col-lg-4 event-box`}>
        <h2 className="title_style">
            <a href={link} className="title_style">
                {truncateTextByWords(title, 20)}
            </a>
        </h2>
        { event.speakers && 
          <div className="subtitle_style fas fa-user"> {event.speakers.map(speaker => `${speaker.firstName || ''} ${speaker.lastName || ''}`).join(', ')}</div> 
        }
        <div className="subtitle_style far fa-calendar"> {date}</div>
        <div className="subtitle_style fas fa-map-marker-alt"> {room}</div>
        <div className={`subtitle_style ${event.type === 'seminar' ? 'fa fa-tags' : event.type === 'conference' ? 'fa fa-link' : ''}`}> {tags}</div>
        { show_excerpt && 
          <div className="excerpt_style">
            <Markdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {truncateTextByWords(event.abstract ? event.abstract : event.description, 30)}
            </Markdown>
          </div>
        }
    </div>
}