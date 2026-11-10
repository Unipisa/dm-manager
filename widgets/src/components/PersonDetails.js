import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import Accordion from './Accordion';
import { Loading } from './Loading';
import { formatDateInterval, getManageURL, getResearchGroupLabel, getRoleLabel, getRoomDetails, isEnglish } from '../utils';
import './styles.css';

export function PersonDetails({ person_id }) {
    const { isLoading, error, data } = useQuery(['person', person_id], async () => {
        if (!person_id) {
            throw new Error('Id non può essere vuota');
        }
        const res = await axios.get(getManageURL(`public/person/${person_id}`));
        const person = res.data.data;
        if (!person) {
            throw new Error("Impossibile trovare la persona richiesta");
        }
        return person;
    });

    if (isLoading) {
        return <Loading widget="Scheda personale" />;
    }

    if (error) {
        return <Loading widget="Scheda personale" error={error} />;
    }

    if (!data) {
        return <div>Nessun dato</div>;
    }

    const en = isEnglish();
    const about = en ? data.about_en : data.about_it;

    return (
        <div className="dm-person-details">
            <PersonBlock data={data} en={en}/>
            {about && <section className="dm-person-biography-section" aria-label={en ? 'About' : 'Profilo'}>
                <h3 className="dm-person-biography-title">{en ? 'About' : 'Profilo'}</h3>
                <p className="dm-person-biography">{about}</p>
            </section>}
            <div className="dm-person-details-accordions">
                <Duties data={data} en={en}/>
                <UnimapData data={data} en={en}/>
            </div>
        </div>
    );
}

function DetailRow({ icon, children }) {
    return <div className="dm-person-detail-row">
        <i className={`${icon} fa-fw`} aria-hidden="true"></i>
        <div>{children}</div>
    </div>;
}

function PersonBlock({ data, en }) {
    const photoUrl = data.photoUrl?.trim();
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    const feminine = data.gender === 'Donna';
    const staffs = data.staffs || [];
    const qualification = staffs.map(staff => getRoleLabel(staff.qualification, en, feminine)).join(', ');
    const researchGroup = [...new Set(staffs.flatMap(staff => staff.SSD || []).filter(Boolean).map(ssd => getResearchGroupLabel(ssd, en)))].join(', ');
    const rooms = (data.roomAssignments || []).filter(assignment => assignment.roomDetails)
        .map(assignment => getRoomDetails(assignment.roomDetails, assignment.room, en));

    return <div className="dm-person-profile">
        {photoUrl && <div className="dm-person-profile-portrait">
            <img src={photoUrl} className="dm-person-profile-photo" alt={name} decoding="async" />
        </div>}
        <div className="dm-person-profile-info">
            <h2 className="dm-person-profile-name">{name}</h2>
            {qualification && <p className="dm-person-profile-qualification">{qualification}</p>}
            <div className="dm-person-profile-details">
                {researchGroup && <DetailRow icon="fas fa-users">
                    {en ? `${researchGroup} Research Group` : `Gruppo di Ricerca in ${researchGroup}`}
                </DetailRow>}
                {rooms.length > 0 && <DetailRow icon="fas fa-door-open">
                    <div className="dm-person-rooms">
                        {rooms.map((room, index) => <div key={index}>
                            <div>{[room.buildingName, room.floorName].filter(Boolean).join(', ')}, <a href={room.roomLink.url} target="_blank" rel="noopener noreferrer">{room.roomLink.text}</a></div>
                            <div className="dm-person-address">{room.roadName}</div>
                        </div>)}
                    </div>
                </DetailRow>}
                {data.email && <DetailRow icon="fas fa-at">
                    <a href={`mailto:${data.email}`}>{data.email}</a>
                </DetailRow>}
                {data.phone && <DetailRow icon="fas fa-phone">
                    <a href={`tel:${data.phone}`}>{data.phone}</a>
                </DetailRow>}
                {data.personalPage && <DetailRow icon="fas fa-link">
                    <a href={data.personalPage} target="_blank" rel="noopener noreferrer">{en ? 'Personal web page' : 'Pagina web personale'}</a>
                    {!data.cv && <span className="dm-person-detail-note">
                        {en ? '(The CV is available on this webpage)' : '(Il CV è disponibile a questa pagina web)'}
                    </span>}
                </DetailRow>}
                {data.cv && <DetailRow icon="fas fa-file-pdf">
                    <a href={data.cv} target="_blank" rel="noopener noreferrer">Curriculum vitae (PDF)</a>
                </DetailRow>}
            </div>
        </div>
    </div>;
}

function Duties({data, en}) {
    const memberOfOne = data.groups
        .filter(group => group.memberCount === 1 && !/^(MAT\/|MATH-)/.test(group.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    const memberOfMultiple = data.groups
        .filter(group => group.memberCount > 1 && !/^(MAT\/|MATH-)/.test(group.name))
        .sort((a, b) => {
            if (a.chair === data._id && b.chair !== data._id) return -1;
            if (a.chair !== data._id && b.chair === data._id) return 1;
            return a.name.localeCompare(b.name);
        });

    if (memberOfOne.length === 0 && memberOfMultiple.length === 0) {
        return null;
    }

    return (
        <Accordion title={en ? "Administrative duties" : "Incarichi"}>
            {memberOfOne.length > 0 && (
                <ul>
                    {memberOfOne.map(group => (
                        <li key={group.name}>{group.name}</li>
                    ))}
                </ul>
            )}
            {memberOfMultiple.length > 0 && (
                <div>
                    <h5>{en ? "Member of" : "Membro di"}</h5>
                    <ul>
                        {memberOfMultiple.map(group => (
                            <li key={group.name}>
                                {group.name} 
                                {group.chair === data._id && <span className="badge badge-primary mr-2">{en ? "Chair" : group.chair_title}</span>}
                                {group.vice === data._id && <span className="badge badge-primary mr-2">{en ? "Deputy Chair" : group.vice_title}</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Accordion>
    );
}

function UnimapData({data, en}) {
    const matricola = data?.staffs?.length > 0 ? data.staffs[0].matricola : null;
    const { isLoading, error, data: unimapData } = useQuery([ 'unimap', matricola ], async () => {
        if (!matricola) return null
        try {
            const res = await axios.get(getManageURL('public/unimap/' + matricola));
            return res.data;
        }
        catch {
            return { 'error': 'Impossibile scaricare i dati di unimap' };
        }
    })

    if (isLoading) {
        return <Loading widget="Dati Unimap" />;
    }

    if (error) {
        return <Loading widget="Dati Unimap" error={error} />;
    }

    if (!matricola) {
        console.log("Impossibile determinare la matricola");
        return null;
    }

    const pubLinks = [
        { label: unimapData && unimapData.arpiLink === "https://arpi.unipi.it" ? "" : (unimapData && unimapData.arpiLink ? "Arpi" : ""), url: unimapData ? unimapData.arpiLink : null },
        { label: "Google Scholar", url: data.google_scholar ? `https://scholar.google.com/citations?user=${data.google_scholar}` : null },
        { label: "ORCID", url: data.orcid ? `https://orcid.org/${data.orcid}` : null },
        { label: "ArXiV", url: data.arxiv_orcid ? `https://arxiv.org/a/${data.orcid}` : null },
        { label: "MathSciNet", url: data.mathscinet ? `https://mathscinet.ams.org/mathscinet/MRAuthorID/${data.mathscinet}` : null }
    ].filter(link => link.url !== null && link.label !== "");

    return (
        <>
            {((unimapData?.arpiPublishedPapers && unimapData.arpiPublishedPapers.length > 0) ||
                (unimapData?.arpiAcceptedPapers && unimapData.arpiAcceptedPapers.length > 0) ||
                pubLinks.length > 0 ||
                (data.grants && data.grants.length > 0) ||
                (unimapData?.registri && unimapData.registri.length > 0)) &&
                (unimapData && !unimapData.error) && (
                    <>
                        {(unimapData.arpiPublishedPapers && unimapData.arpiPublishedPapers.length > 0) ||
                            (unimapData.arpiAcceptedPapers && unimapData.arpiAcceptedPapers.length > 0) ||
                            pubLinks.length > 0 ||
                            (data.grants && data.grants.length > 0) ? (
                            <Accordion title={en ? "Research" : "Ricerca"}>
                                <div>
                                    {unimapData.arpiAcceptedPapers && unimapData.arpiAcceptedPapers.length > 0 && (
                                        <>
                                            <h5 className="my-2">{en ? "Accepted papers" : "Articoli accettati"}</h5>
                                            <PublicationList publications={unimapData.arpiAcceptedPapers} />
                                        </>
                                    )}
                                    {unimapData.arpiPublishedPapers && unimapData.arpiPublishedPapers.length > 0 && (
                                        <>
                                            <h5 className="my-2">{en ? "Published papers" : "Pubblicazioni"}</h5>
                                            <PublicationList publications={unimapData.arpiPublishedPapers} />
                                        </>
                                    )}
                                    {pubLinks.length > 0 && (
                                        <div>
                                            {en ? "See all publications on: " : "Vedi tutte le pubblicazioni su: "}
                                            <PublicationLinks pubLinks={pubLinks} />
                                        </div>
                                    )}
                                    {data.grants && data.grants.length > 0 && (
                                        <>
                                            <h5 className="my-2">{en ? 'Grants' : 'Finanziamenti'}</h5>
                                            <GrantList en={en} grants={data.grants.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))} />
                                        </>
                                    )}
                                </div>
                            </Accordion>
                        ) : null}
    
                        {unimapData.registri && unimapData.registri.length > 0 && (
                            <Accordion title={en ? "Teaching" : "Didattica"}>
                                <CourseList unimapData={unimapData} en={en} />
                            </Accordion>
                        )}
                    </>
                )}
        </>
    );
}

function PublicationLinks({pubLinks}) {
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

function PublicationList({ publications }) {
    return <ul>
        {publications.slice(0, 5).map((p) => (
            <li key={p.link}>
                <a href={p.link} target="_blank" rel="noopener noreferrer">{p.title}</a> 
                {p.anno !== "9999" && ` [${p.anno}]`}
            </li>
        ))}
    </ul>
}

function GrantList ({ grants, en }) {
    return <ul>
        {grants.map((g) => {
            return (
                <li key={g._id}>
                    <a href={`/research/grant-details/?grant_id=${g._id}`}>{g.name}</a>
                    <span className="text-muted small"> ({g.projectType})</span><br />
                    Principal Investigator: <em>{g.piDetails?.firstName} {g.piDetails?.lastName}</em><br />
                    {en ? "Project period" : "Periodo"}: {formatDateInterval(g.startDate, g.endDate)}
                </li>
            );
        })}
    </ul>
}

function CourseList ({ unimapData, en }) {
    const coursesDesc = en ? "Courses for the current academic year:" : "Corsi insegnati nel corrente anno accademico:";

    const courses = (unimapData.registri || []).map(c => (
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
                    <ul>{courses}</ul>
                </>
            )}
        </div>
    );
};
