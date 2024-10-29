import { Card } from 'react-bootstrap'
import { useQuery } from 'react-query'

import { useEngine } from '../Engine'

function CheckCard({ title, data, renderRow }) {
    return (
        <Card className="mt-3">
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <table>
                    <tbody>
                        {data.map((item, i) => (
                            <tr key={i}>
                                {renderRow(item, i)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card.Body>
        </Card>
    );
}

function RenderCheckMultipleItems(item, keyField, pathPrefix) {
    const effectiveKeyField = item._id[keyField] ? keyField : (item._id.title ? 'title' : 'startDate');

    return (
        <>
            <td>{item._id[effectiveKeyField]}</td>
            <td>
                {item.ids.map((id, j) => (
                    <a className="btn" key={j} href={`${pathPrefix}/${id}`}>{j + 1}</a>
                ))}
            </td>
        </>
    );
}

function RenderCheckSingleItem(item, i, pathPrefix) {
    return (
        <td>
            <a className="btn" href={`${pathPrefix}/${item._id}`}>{i + 1}</a>
        </td>
    );
}

export default function SanityCheck() {
    const user = useEngine().user;
    const { isLoading, error, data } = useQuery(['process', 'sanityCheck']);

    if (isLoading) {
        return "Loading";
    }

    if (!data) {
        return "Error: " + error.message;
    }

    if (!user.roles.includes('admin')) return <>Not authorized</>;

    return (
        <>
            <CheckCard
                title="Duplicated LastName+FirstName"
                data={data.duplicatedNames}
                renderRow={(item) => RenderCheckMultipleItems(item, 'lastName', '/person')}
            />
            <CheckCard
                title="Duplicated Emails"
                data={data.duplicatedEmails}
                renderRow={(item) => RenderCheckMultipleItems(item, 'email', '/person')}
            />
            <CheckCard
                title="Duplicated Institutions"
                data={data.duplicatedInstitutions}
                renderRow={(item) => RenderCheckMultipleItems(item, 'name', '/institution')}
            />
            <CheckCard
                title="Duplicated Seminars"
                data={data.duplicatedSeminars}
                renderRow={(item) => RenderCheckMultipleItems(item, 'title', '/event-seminar')}
            />
            <CheckCard
                title="Duplicated Events"
                data={data.duplicatedEvents}
                renderRow={(item) => RenderCheckMultipleItems(item, 'title', '/event-conference')}
            />
            <CheckCard
                title="Missing Matricola"
                data={data.missingMatricola}
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/staff')}
            />
            <CheckCard
                title="Missing SSD"
                data={data.missingSSD}
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/staff')}
            />
            <CheckCard
                title="Missing Country in Institution"
                data={data.missingInstitutionCountry}
                renderRow={(item) => (
                    <td>
                        <a className="btn" href={`/institution/${item._id}`}>{item.name}</a>
                    </td>
                )}
            />
            <CheckCard
                title="Seminars TBA"
                data={data.seminarsTBA}
                renderRow={(item) => (
                    <td>
                        <a className="btn" href={`/event-seminar/${item._id}`}>{item.title}</a>
                    </td>
                )}
            />
            <CheckCard
                title="Visits TBD"
                data={data.visitsTBD}
                renderRow={(item) => (
                    <td>
                        <a className="btn" href={`/visit/${item._id}`}>{item.collaborationTheme}</a>
                    </td>
                )}
            />
            <CheckCard
                title="Person with trailing spaces"
                data={data.personsWithTrailingSpaces}
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/person')}
            />
            <CheckCard
                title="Institution with trailing spaces"
                data={data.institutionsWithTrailingSpaces}
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/institution')}
            />
        </>
    );
}