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
    const groups = (
      <div>
          <ul>
              {data.groups.filter(group => group.memberCount === 1).map(group => (
                  <li key={group.name}>{group.name}</li>
              ))}
          </ul>
          <div>
              {en ? "Member of" : "Membro di"}
              <ul>
                  {data.groups.filter(group => group.memberCount > 1).sort((a, b) => {
                      if (a.chair === data._id && b.chair !== data._id) return -1;
                      if (a.chair !== data._id && b.chair === data._id) return 1;
                      return 0;
                  }).map(group => (
                      <li key={group.name}>
                          {group.name} {group.chair === data._id && (
                                <span className="badge badge-primary mr-2">
                                    {en ? "Chair" : group.chair_title}
                                </span>
                            )} 
                            {group.vice === data._id && (
                                <span className="badge badge-primary mr-2">
                                    {en ? "Deputy Chair" : group.vice_title}
                                </span>
                            )}
                      </li>
                  ))}
              </ul>
          </div>
      </div>
    );
    const pubLinks = [];
    if (data.arpiLink) {
        pubLinks.push({
          label: "Arpi",
          url: `${data.arpiLink}`,
        });
    }
    if (data.google_scholar) {
        pubLinks.push({
            label: "Google Scholar",
            url: `https://scholar.google.com/citations?user=${data.google_scholar}`,
        });
    }
    if (data.orcid) {
        pubLinks.push({
            label: "ORCID",
            url: `https://orcid.org/${data.orcid}`,
        });
    }
    if (data.arxiv_orcid) {
        pubLinks.push({
            label: "ArXiV",
            url: `https://arxiv.org/a/${data.orcid}`,
        });
    }
    if (data.mathscinet) {
        pubLinks.push({
            label: "MathSciNet",
            url: `https://mathscinet.ams.org/mathscinet/MRAuthorID/${data.mathscinet}`,
        });
    }
    const pubLinksHtml = pubLinks.map(x => `<a href="${x.url}" target="_blank">${x.label}</a>`).join(", \n");
    
    const publicationsText = data.arpiPublications.slice(0,5).map(p => {
        return (
          `<li>
              <a href="${p.link}" target="_blank">${p.title}</a> [${p.anno}] 
          </li>`
        );
    }).join("\n") 

    const publicationsDesc = en ? "Recent publications" : "Pubblicazioni recenti"

    const publications = publicationsText.length > 0 ? (
      `<h5 class="my-2">${publicationsDesc}</h5>
        <ul>
            ${publicationsText}
        </ul>`
    ) : '';


    const grantList = (data.grants || []).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    const grantText = grantList.map(g => {
        const period = formatDateInterval(g.startDate, g.endDate);
        const ppText = en ? "Project period" : "Periodo";
        return (
            `<li>
                <a href="/research/grant-details/?grant_id=${g._id}">${g.name}</a>
                <span class="text-muted small">(${g.projectType})</span><br>
                Principal Investigator: <em>${g.piDetails.firstName} ${g.piDetails.lastName}</em><br>
                ${ppText}: ${period}
            </li>`
        );
    }).join("\n");

    const finanziamentiDesc = en ? 'Grants' : 'Finanziamenti';

    const grants = grantList.length > 0 ? (
        `<h5 class="my-2">${finanziamentiDesc}</h5>
        <ul>
            ${grantText}
        </ul>`
    ) : '';

    const research = (
      <div>
        <span dangerouslySetInnerHTML={{ __html: publications }} />
        {en ? "See all publications on: " : "Vedi tutte le pubblicazioni su: "}
        <span dangerouslySetInnerHTML={{ __html: pubLinksHtml }} />
        <span dangerouslySetInnerHTML={{ __html: grants }} />
      </div>
    )

    const coursesDesc = en ? "Courses for the current academic year:" : "Corsi insegnati nel corrente anno accademico:"

    const coursesText = data.registri.map(c => {
        return (
          `<li>
            ${c.modulo !== 'NESSUNO' 
                ? `<strong>${c.modulo}</strong> (Modulo dell'insegnamento ${c.descrizione} - Cod. ${c.codiceInsegnamento}) CdS ${c.codiceCorso} ${c.denominazione}`
                : `<strong>${c.descrizione}</strong> (Cod. ${c.codiceInsegnamento}) CdS ${c.codiceCorso} ${c.denominazione}`}
            (<a href="https://unimap.unipi.it/registri/dettregistriNEW.php?re=${c.id}::::&ri=${c.matricola}" target="_blank">Registro</a>)
        </li>`
        )
    }).join("\n");

    const coursesAll = coursesText.length > 0 ? (
      `<p>${coursesDesc}</p>
      <ul>
          ${coursesText}
      </ul>`
  ) : '';

    const courses = (
      <div>
        <span dangerouslySetInnerHTML={{ __html: coursesAll }} />
      </div>
    )

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
        <p class="mb-4">
          {data.about_en || data.about_it ? (en ? ` ${data.about_en}` : ` ${data.about_it}`) : null}
        </p>
        <Accordion title={en ? "Administrative duties" : "Incarichi"} content={groups} />
        <Accordion title={en ? "Research" : "Ricerca"} content={research} />
        <Accordion title={en ? "Teaching" : "Didattica"} content={courses} />
        { /*
        {research_accordion}
        {courses_data}
        Scheda personale {JSON.stringify(data)}
        */ }
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