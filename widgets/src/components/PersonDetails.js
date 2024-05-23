import React from 'react';
import { getManageURL, getSSDLink, getDMURL, formatDateInterval } from '../utils';
import axios from 'axios'
import { Loading } from './Loading'
import Accordion from './Accordion'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { useQuery } from 'react-query'
import { get } from 'mongoose';

export function PersonDetails({ id , en }) {
    const { isLoading, error, data } = useQuery([ 'person', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/person/' + id))
            const person = res.data.data
            if (! person) {
                throw new Error("Impossibile trovare la persona richiesta")
            }

            return person
        }
        else {
            throw new Error('Impossibile trovare la persona richiesta')
        }
    })

    if (isLoading || error ) {
        return <Loading widget="Scheda personale" error={error}></Loading>
    }

    if (! data) {
        return <div>
            404 Not Found.
        </div>
    }

    const photoUrl = data.photoUrl || "/static/NoImage.png"
    const feminine = data.gender === 'Donna'
    const qualification = (data.staffs || []).map(q => get_role_label(q.qualification,en,feminine)).join(', ')
    const research_group_text = data.staffs.map(q=>q.SSD).filter(q=>q).map(ssd => get_research_group_label(ssd, en)).join(', ')
    const room_details = (data.roomAssignments || []).map(r => {
      const details = get_room_details(r.roomDetails, r.room, en);
      return (
          <div key={details.roomLink} dangerouslySetInnerHTML={{ __html: `${details.buildingName}, ${details.floorName}, ${details.roomLink}${details.roadName}` }} />
      );
    });

    return <div>
        <div class="entry-content box clearfix mb-0">
            <div class="d-flex flex-wrap align-middle">
                <div class="mr-4 mb-4">
                    <img width="280" height="280" src={photoUrl} class="rounded img-fluid" alt="" decoding="async" />
                </div>
                <div class="ml-4">
                    <div class="h2 mb-2">{data.firstName} {data.lastName}</div>
                    <div class="h5 mb-2">{qualification}</div>
                    <p class="my-1">
                      <i class="fas fa-users mr-2">
                        {en ? ` ${research_group_text} Research Group` : ` Gruppo di Ricerca in ${research_group_text}`}
                      </i>
                    </p>
                    <div class="d-flex justify-left">
                      <div>
                        <i class="fas fa-address-card mr-2"></i>
                      </div>
                      <div> {room_details}</div>
                    </div>
                    <p class="my-1">
                      <i class="fas fa-at mr-2"> <a href={`mailto:${data.email}`}>{data.email}</a></i>
                    </p>
                    <p class="my-1">
                      <i class="fas fa-phone mr-2"> <a href={`tel:${data.phone}`}>{data.phone}</a></i>
                    </p>
                    <p class="my-1">
                      <i class="fas fa-link mr-2"> <a href={data.personalPage}>{data.personalPage}</a></i>
                      <br>
                      </br>
                      {en ? (
                        <span class="small text-muted">
                          (The CV is available on this webpage)
                        </span>
                      ) : (
                        <span class="small text-muted">
                          (Il CV è disponibile a questa pagina web)
                        </span>
                      )}
                    </p>
                </div>
            </div>
        </div>
        <Accordion title="Accordion Title 1" content="Accordion Content 1" />

        { /*
        {about}
        {duties_accordion}
        {research_accordion}
        {courses_data}
        */ }
        Scheda personale {JSON.stringify(data)}
    </div>
}

function get_role_label(role, english, feminine) {
    const ROLES = {
        'PO': ['Professore Ordinario', 'Professoressa Ordinaria', 'Full Professor', 'Full Professor'],
        'PA': ['Professore Associato', 'Professoressa Associata', 'Associate Professor', 'Associate Professor'],
        'RTDb': ['Ricercatore a tempo determinato senior', 'Ricercatrice a tempo determinato senior', 'Tenure-track Assistant Professor', 'Tenure-track Assistant Professor'],
        'RTDa': ['Ricercatore a tempo determinato junior', 'Ricercatrice a tempo determinato junior', 'Non-Tenure-Track Assistant Professor', 'Non-Tenure-Track Assistant Professor'],
        'RIC': ['Ricercatore a tempo indeterminato', 'Ricercatrice a tempo indeterminato', 'Tenured Assistant Professor', 'Tenured Assistant Professor'],
        'Assegnista': ['Assegnista', 'Assegnista', 'Postdoctoral Fellow', 'Postdoctoral Fellow'],
        'Dottorando': ['Dottorando', 'Dottoranda', 'Ph.D. Student', 'Ph.D. Student'],
        'PTA': ['Personale Tecnico Amministrativo', 'Personale Tecnico Amministrativo', 'Administrative Staff', 'Administrative Staff'],
        'Professore Emerito': ['Professore Emerito', 'Professore Emerito', 'Emeritus Professor', 'Emeritus Professor'],
        'Collaboratore': ['Collaboratore', 'Collaboratrice', 'Affiliate Member', 'Affiliate Member'], 
        'Docente Esterno': ['Docente con contratto esterno', 'Docente con contratto esterno', 'Adjunct Professor', 'Adjunct Professor'],
        'Studente': ['Studente', 'Studentessa', 'Student', 'Student'],
    }

    const i = (feminine ? 1 : 0) + (english ? 2 : 0)
    if (ROLES[role]) return ROLES[role][i]
    return role
}

function get_room_details(room, number, en) {
  let buildingName;
  let floorName;
  let roadName;
  let roomLink;

  switch (room.building) {
    case 'A':
      buildingName = en ? 'Building A' : 'Edificio A';
      roadName = 'Largo Bruno Pontecorvo, 5'
      break;
    case 'B':
      buildingName = en ? 'Building B' : 'Edificio B';
      roadName = 'Largo Bruno Pontecorvo, 5'
      break;
    case 'X':
      buildingName = 'ex DMA';
      roadName = 'Via Buonarroti, 1/c';
      break;
    default:
      buildingName = room.building;
  }
  roadName += en ? ', 56127 Pisa (PI), Italy' : ', 56127 Pisa (PI), Italia'

  switch (room.floor) {
    case '0':
      floorName = en ? 'Ground floor' : 'Piano terra';
      break;
    case '1':
      floorName = en ? 'First floor' : 'Primo piano';
      break;
    case '2':
      floorName = en ? 'Second floor' : 'Secondo piano';
      break;
    case '3':
      floorName = en ? 'Third floor' : 'Terzo piano';
      break;
    default:
      floorName = room.floor;
  }

  const link = en ? getDMURL(`/map?sel=${number}`) : getDMURL(`/mappa?sel=${number}`);
  roomLink = `<a href="${link}">${en ? 'Room' : 'Stanza'} ${room.number}</a><br>`;

  return {
    buildingName,
    floorName,
    roadName,
    roomLink,
  };
}

function get_research_group_label(SSD, en) {
    switch (SSD) {
        case 'MAT/01':
          return en ? 'Mathematical Logic' : 'Logica Matematica'
        case 'MAT/02':
          return 'Algebra'
        case 'MAT/03':
          return en ? 'Geometry' : 'Geometria'
        case 'MAT/04':
          return en ? 'Mathematics Education and History of Mathematics' : 'Didattica della Matematica e Storia della Matematica'
        case 'MAT/05':
          return en ? 'Mathematical Analysis' : 'Analisi Matematica'
        case 'MAT/06':
          return en ? 'Probability and Mathematical Statistics' : 'Probabilità e Statistica Matematica'
        case 'MAT/07':
          return en ? 'Mathematical Physics' : 'Fisica Matematica'
        case 'MAT/08':
          return en ? 'Numerical Analysis' : 'Analisi Numerica'
        default:
          return SSD
    }

}
