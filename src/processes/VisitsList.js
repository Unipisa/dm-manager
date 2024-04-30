import { useQuery } from 'react-query'
import { myDateFormat } from '../Engine'

export default function ProcessVisitsList() {
    return <>
        <h1 className="text-primary pb-0">Elenco visite</h1>
        <VisitsList/>
        **Vengono visualizzate le visite terminate da non più di 30 giorni.
        <br />
        Questa pagina è accessibile da parte di tutti gli utenti 
        inseriti in anagrafica.
    </>
}

function VisitsList() {
    const { isLoading, error, data } = useQuery(['process', 'visitsList'])

    if (isLoading) {
        return "Loading..."
    }

    if (!data) {
        return "Error: " + error.message
    }

    const cellStyle={border: "1px solid", padding: "0.5em"}

    return <table style={{borderCollapse: "collapse"}}>
        <thead>
            <tr>
                <th>dal</th>
                <th>al</th>
                <th>visitatore</th>
                <th>provenienza</th>
                <th>referente</th>
                <th>ufficio</th>
            </tr>
        </thead>
        <tbody>
        {data.data.sort(sortFn).map(
            visit => <tr key={visit._id}>
                <td style={cellStyle}>{myDateFormat(visit.startDate)}</td>
                <td style={cellStyle}>{myDateFormat(visit.endDate)}</td>
                <td style={cellStyle}>{visit.person.firstName} {visit.person.lastName }</td>
                <td style={cellStyle}>{visit.affiliations.map(x => x.name).join(", ")}</td>
                <td style={cellStyle}>{visit.referencePeople.map(p => `${p.firstName} ${p.lastName}`).join(', ')}</td>
                <td style={cellStyle}>{visit.roomAssignments.map(room => roomDescription(visit,room)).join('; ')}</td>
            </tr>
        )}
        </tbody>
    </table>

    function sortFn(a, b) {
        if (a.startDate < b.startDate) return 1
        if (a.startDate > b.startDate) return -1
        return 0
    }

    function roomDescription(visit,assignment) {
        let s = assignment.room.code
        if (assignment.startDate !== visit.startDate)
            s += ` dal ${myDateFormat(assignment.startDate)}`
        if (assignment.endDate !== visit.endDate)
            s += ` al ${myDateFormat(assignment.endDate)}`
        return s
    }

}

