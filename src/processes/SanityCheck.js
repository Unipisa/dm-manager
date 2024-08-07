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
    return (
        <>
            <td>{item._id[keyField]}</td>
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
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/event-seminar')}
            />
            <CheckCard
                title="Duplicated Events"
                data={data.duplicatedEvents}
                renderRow={(item, i) => RenderCheckSingleItem(item, i, '/event-conference')}
            />
            <CheckCard
                title="Missing Matricola"
                data={data.missingMatricola}
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
        </>
    );
}