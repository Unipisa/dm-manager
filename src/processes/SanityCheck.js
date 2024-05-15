import { Card } from 'react-bootstrap'
import { useQuery } from 'react-query'

import { useEngine } from '../Engine'

export default function SanityCheck() {
    const user = useEngine().user
    const { isLoading, error, data } = useQuery(['process', 'sanityCheck'])

    if (isLoading) {
        return "Loading"
    }

    if (!data) {
        return "Error: " + error.message
    }

    if (!user.roles.includes('admin')) return <>Not authorized</>

    return <>
        <Card>
            <Card.Body>
            <Card.Title>Duplicated LastName+FirstName</Card.Title>
            <table>
                <tbody>
                    {data.duplicatedNames.map((item, i) => {
                        return <tr key={i}>
                            <td>{item._id.lastName} {item._id.firstName}</td>
                            <td>
                                {item.ids.map((id, j) => {
                                    return <a className="btn" key={j} href={`/person/${id}`}>{j+1}</a>
                                })}
                            </td>
                        </tr>
                    })}
                </tbody>
            </table>
            </Card.Body>
        </Card>
        <Card className="mt-3">
            <Card.Body>
            <Card.Title>Duplicated Emails</Card.Title>
            <table>
                <tbody>
                    {data.duplicatedEmails.map((item, i) => {
                        return <tr key={i}>
                            <td>{item._id.email}</td>
                            <td>
                                {item.ids.map((id, j) => {
                                    return <a className="btn" key={j} href={`/person/${id}`}>{j+1}</a>
                                })}
                            </td>
                        </tr>
                    })}
                </tbody>
            </table>
            </Card.Body>
        </Card>
        <Card className="mt-3">
            <Card.Body>
            <Card.Title>Missing Matricola</Card.Title>
            <table>
                <tbody>
                    {data.missingMatricola.map((item, i) => {
                        return <tr key={i}>
                            <a className="btn" key={i} href={`/staff/${item._id}`}>{i+1}</a>
                        </tr>
                    })}
                </tbody>
            </table>
            </Card.Body>
        </Card>
        <Card className="mt-3">
            <Card.Body>
            <Card.Title>Missing Country in Institution</Card.Title>
            <table>
                <tbody>
                    {data.missingInstitutionCountry.map((item, i) => {
                        return <tr key={i}>
                            <a className="btn" key={i} href={`/institution/${item._id}`}>{item.name}</a>
                        </tr>
                    })}
                </tbody>
            </table>
            </Card.Body>
        </Card>
    </>
  }
