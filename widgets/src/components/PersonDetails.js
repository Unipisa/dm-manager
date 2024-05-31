import React from 'react';
import axios from 'axios'
import Accordion from './Accordion'
import { getManageURL, formatDateInterval, getRoleLabel, getResearchGroupLabel, getRoomDetails } from '../utils';
import { Loading } from './Loading'
import { useQuery } from 'react-query'

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
    const qualification = (data.staffs || []).map(q => getRoleLabel(q.qualification, en, feminine)).join(', ')
    const researchGroup = data.staffs.map(q => q.SSD).filter(q => q).map(ssd => getResearchGroupLabel(ssd, en)).join(', ')
    const roomDetails = (data.roomAssignments || []).map(r => getRoomDetails(r.roomDetails, r.room, en));
    
    const personBlock = (
      <div class="entry-content box clearfix mb-0">
        <div class="d-flex flex-wrap align-middle">
          <div class="mr-4 mb-4">
            <img width="280" height="280" src={photoUrl} class="rounded img-fluid" alt="" decoding="async" />
          </div>
          <div class="ml-4">
            <div class="h2 mb-2">{data.firstName} {data.lastName}</div>
            {qualification && (
              <div class="h5 mb-2">{qualification}</div>
            )}
            {researchGroup && (
              <p class="my-1">
                <i class="fas fa-users mr-2"></i>
                {en ? `${researchGroup} Research Group` : `Gruppo di Ricerca in ${researchGroup}`}
              </p>
            )}
            {roomDetails && roomDetails.length > 0 && (
              <div class="d-flex justify-left">
                <div>
                  <i class="fas fa-address-card mr-2"></i>
                </div>
                <div>
                  {roomDetails.map((details, index) => (
                    <div key={index}>
                      <span>{details.buildingName}, {details.floorName}, </span>
                      <a href={details.roomLink.url}>{details.roomLink.text}, </a>
                      <br />
                      <span>{details.roadName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.email && (
              <p class="my-1">
                <i class="fas fa-at mr-2"></i>
                <a href={`mailto:${data.email}`}>{data.email}</a>
              </p>
            )}
            {data.phone && (
              <p class="my-1">
                <i class="fas fa-phone mr-2"></i>
                <a href={`tel:${data.phone}`}>{data.phone}</a>
              </p>
            )}
            {data.personalPage && (
              <p class="my-1">
                <i class="fas fa-link mr-2"></i>
                <a href={data.personalPage}>{data.personalPage}</a>
                <br />
                {en ? (
                  <span class="small text-muted">(The CV is available on this webpage)</span>
                  ) : (
                  <span class="small text-muted">(Il CV è disponibile a questa pagina web)</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    )

    const memberOfOne = data.groups.filter(group => group.memberCount === 1 && !group.name.startsWith("MAT/"));
    const memberOfMultiple = data.groups.filter(group => group.memberCount > 1 && !group.name.startsWith("MAT/")).sort((a, b) => {
      if (a.chair === data._id && b.chair !== data._id) return -1;
      if (a.chair !== data._id && b.chair === data._id) return 1;
      return 0;
    });
    
    const groups = (memberOfOne.length > 0 || memberOfMultiple.length > 0) ? (
      <div>
        {memberOfOne.length > 0 && (
          <ul>
            {memberOfOne.map(group => (
              <li key={group.name}>{group.name}</li>
            ))}
          </ul>
        )}
        {memberOfMultiple.length > 0 && (
          <div>
            {en ? "Member of" : "Membro di"}
            <ul>
              {memberOfMultiple.map(group => (
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
        )}
      </div>
    ) : null;

    const pubLinks = [
      { label: data.arpiLink ? "Arpi" : "", url: data.arpiLink },
      { label: "Google Scholar", url: data.google_scholar ? `https://scholar.google.com/citations?user=${data.google_scholar}` : null },
      { label: "ORCID", url: data.orcid ? `https://orcid.org/${data.orcid}` : null },
      { label: "ArXiV", url: data.arxiv_orcid ? `https://arxiv.org/a/${data.orcid}` : null },
      { label: "MathSciNet", url: data.mathscinet ? `https://mathscinet.ams.org/mathscinet/MRAuthorID/${data.mathscinet}` : null }
    ].filter(link => link.url !== null && link.label !== "");

    const PublicationLinks = () => {
      if (pubLinks.length === 0) {
        return null;
      }
    
      return pubLinks
        .map(link => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))
        .reduce((prev, curr) => [prev, ', ', curr]);
    };

    const PublicationList = ({ publications }) => (
      <ul>
        {publications.slice(0, 5).map(p => (
          <li key={p.link}>
            <a href={p.link} target="_blank" rel="noopener noreferrer">{p.title}</a> [{p.anno}]
          </li>
        ))}
      </ul>
    );

    const GrantList = ({ grants }) => (
      <ul>
        {grants.map(g => {
          return (
            <li key={g._id}>
              <a href={`/research/grant-details/?grant_id=${g._id}`}>{g.name}</a>
              <span className="text-muted small"> ({g.projectType})</span><br />
              Principal Investigator: <em>{g.piDetails.firstName} {g.piDetails.lastName}</em><br />
              {en ? "Project period" : "Periodo"}: {formatDateInterval(g.startDate, g.endDate)}
            </li>
          );
        })}
      </ul>
    );

    const research = (
      <>
        {(data.arpiPublications && data.arpiPublications.length > 0) ||
        (pubLinks.length > 0) ||
        (data.grants && data.grants.length > 0) ? (
          <div>
            {data.arpiPublications && data.arpiPublications.length > 0 && (
              <>
                <h5 className="my-2">{en ? "Recent publications" : "Pubblicazioni recenti"}</h5>
                <PublicationList publications={data.arpiPublications} />
              </>
            )}
            {pubLinks.length > 0 && (
              <div>
                {en ? "See all publications on: " : "Vedi tutte le pubblicazioni su: "}
                <PublicationLinks />
              </div>
            )}
            {data.grants && data.grants.length > 0 && (
              <>
                <h5 className="my-2">{en ? 'Grants' : 'Finanziamenti'}</h5>
                <GrantList grants={data.grants.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))} />
              </>
            )}
          </div>
        ) : null}
      </>
    );

    const CourseList = ({ en }) => {
      const coursesDesc = en ? "Courses for the current academic year:" : "Corsi insegnati nel corrente anno accademico:";
    
      const courses = (data.registri || []).map(c => (
        <li key={c.id}>
          {c.modulo !== 'NESSUNO' ? (
            <strong>{c.modulo}</strong>
          ) : (
            <strong>{c.descrizione}</strong>
          )}
          {' '}
          {c.modulo !== 'NESSUNO' ? (
            `(Modulo dell'insegnamento ${c.descrizione} - Cod. ${c.codiceInsegnamento}) CdS ${c.codiceCorso} ${c.denominazione}`
          ) : (
            `(Cod. ${c.codiceInsegnamento}) CdS ${c.codiceCorso} ${c.denominazione}`
          )}
          {' '}
          (<a href={`https://unimap.unipi.it/registri/dettregistriNEW.php?re=${c.id}::::&ri=${c.matricola}`} target="_blank" rel="noopener noreferrer">Registro</a>)
        </li>
      ));
    
      return (
        <div>
          {courses.length > 0 && (
            <>
              <p>{coursesDesc}</p>
              <ul>
                {courses}
              </ul>
            </>
          )}
        </div>
      );
    };

    return (
      <div>
        {personBlock}
        {(data.about_en || data.about_it) && (
          <p className="mb-4">{en ? ` ${data.about_en}` : ` ${data.about_it}`}</p>
        )}
        {groups && (
          <Accordion title={en ? "Administrative duties" : "Incarichi"} content={groups} />
        )}
        {(data.arpiPublications && data.arpiPublications.length > 0) ||
        (pubLinks.length > 0) ||
        (data.grants && data.grants.length > 0) ? (
          <Accordion title={en ? "Research" : "Ricerca"} content={research} />
        ) : null}
        {data.registri && data.registri.length > 0 && (
          <Accordion title={en ? "Teaching" : "Didattica"} content={CourseList({ en })} />
        )}
      </div>
    );
}