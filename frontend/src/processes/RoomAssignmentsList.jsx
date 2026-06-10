import { useQuery } from 'react-query'
import { myDateFormat, useQueryFilter } from '../Engine'

export default function ProcessAssignmentsList() {
    return <>
        <h1 className="text-primary pb-0 mb-3">Elenco assegnazioni</h1>
        <AssignmentsList/>
        **Vengono visualizzate le assegnazioni delle stanze attuali e future.
        <div>
        <i>Chi può accedere a questa pagina?</i><br />
        Questa pagina è accessibile a tutti gli utenti 
        con permesso <i>/process/roomAssignmentsList</i>.
        </div>
    </>
}

function AssignmentsList() {
    const filter = useQueryFilter({ _search: '' });
    const { isLoading, error, data } = useQuery(['process', 'roomAssignmentsList']);

    if (isLoading) {
        return 'Loading...';
    }

    if (error || !data?.data) {
        return 'Error: ' + (error ? error.message : 'Dati non disponibili');
    }

    const updateFilter = (evt) => {
        filter.setFilter(filter => ({
            ...filter,
            "_search": evt.target.value
        }));
    };

    const filterAssignments = (assignments) => {
        if (!filter.filter._search) return assignments;
        
        return assignments.filter(assignment => {
            const searchString = filter.filter._search.toLowerCase();
            const { person, room } = assignment;
            const roomData = room[0] || {};
            
            const searchableText = `
                ${person.firstName?.toLowerCase() || ''}
                ${person.lastName?.toLowerCase() || ''}
                ${person.email?.toLowerCase() || ''}
                ${person.phone?.toLowerCase() || ''}
                ${person.affiliations?.map(aff => aff.name?.toLowerCase()).join(' ') || ''}
                ${roomData.floor?.toString().toLowerCase() || ''}
                ${roomData.number?.toString().toLowerCase() || ''}
                ${roomData.notes?.toString().toLowerCase() || ''}
                ${roomData.code?.toLowerCase() || ''}
                ${roomData.building?.toLowerCase() || ''}
                ${assignment.startDate ? myDateFormat(assignment.startDate).toLowerCase() : ''}
                ${assignment.endDate ? myDateFormat(assignment.endDate).toLowerCase() : ''}
            `;

            return searchableText.includes(searchString);
        });
    };

    const sortedAssignments = [...data.data].sort((a, b) => a.room[0]?.code.localeCompare(b.room[0]?.code));
    const filteredAssignments = filterAssignments(sortedAssignments);

    const currentAssignmentsA = [], futureAssignmentsA = [];
    const currentAssignmentsB = [], futureAssignmentsB = [];
    const currentAssignmentsX = [], futureAssignmentsX = [];
    
    const today = new Date();
    
    filteredAssignments.forEach((assignment) => {
        const startDate = assignment.startDate ? new Date(assignment.startDate) : null;
        const endDate = assignment.endDate ? new Date(assignment.endDate) : null;
        const building = assignment.room[0]?.building;
    
        const isCurrent = (!startDate || startDate <= today) && (!endDate || endDate >= today);
        const isFuture = startDate && startDate > today;
    
        if (isCurrent) {
            if (building === "A") currentAssignmentsA.push(assignment);
            else if (building === "B") currentAssignmentsB.push(assignment);
            else if (building === "X") currentAssignmentsX.push(assignment);
        }
    
        if (isFuture) {
            if (building === "A") futureAssignmentsA.push(assignment);
            else if (building === "B") futureAssignmentsB.push(assignment);
            else if (building === "X") futureAssignmentsX.push(assignment);
        }
    });

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Cerca per nome, stanza, affiliazione..."
                    value={filter.filter._search}
                    onChange={updateFilter}
                />
            </div>

            <h2 className="mb-4">Assegnazioni Attuali</h2>
    
            {currentAssignmentsA.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio A</h4>
                    <RoomAssignmentsTable assignments={currentAssignmentsA} className="mb-4" />
                </>
            )}
            {currentAssignmentsB.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio B</h4>
                    <RoomAssignmentsTable assignments={currentAssignmentsB} className="mb-4" />
                </>
            )}
            {currentAssignmentsX.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio Ex Albergo</h4>
                    <RoomAssignmentsTable assignments={currentAssignmentsX} className="mb-4" />
                </>
            )}
    
            <h2 className="mb-4 mt-5">Assegnazioni Future</h2>
    
            {futureAssignmentsA.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio A</h4>
                    <RoomAssignmentsTable assignments={futureAssignmentsA} className="mb-4" />
                </>
            )}
            {futureAssignmentsB.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio B</h4>
                    <RoomAssignmentsTable assignments={futureAssignmentsB} className="mb-4" />
                </>
            )}
            {futureAssignmentsX.length > 0 && (
                <>
                    <h4 className="mb-2">Edificio Ex Albergo</h4>
                    <RoomAssignmentsTable assignments={futureAssignmentsX} className="mb-4" />
                </>
            )}
        </div>
    );
}

function RoomAssignmentsTable({ assignments }) {
    if (assignments.length === 0) {
        return
    }

    return (
        <table className="table table-striped table-bordered">
            <thead className="table-dark">
                <tr>
                    <th scope="col">Piano</th>
                    <th scope="col">Stanza</th>
                    <th scope="col">Note</th>
                    <th scope="col">Assegnazione</th>
                    <th scope="col">Periodo</th>
                </tr>
            </thead>
            <tbody>
                {assignments.map((assignment) => {
                    const { person, room, startDate, endDate } = assignment;
                    const { firstName, lastName, affiliations, email, phone } = person;
                    const roomData = room[0] || {};

                    const period =
                        startDate && endDate
                            ? `${myDateFormat(startDate)} - ${myDateFormat(endDate)}`
                            : startDate
                            ? `Dal ${myDateFormat(startDate)}`
                            : endDate
                            ? `Fino al ${myDateFormat(endDate)}`
                            : "";

                    const affiliationNames = affiliations.map((aff) => aff.name).join(", ");
                    const contactDetails = [phone, email].filter(Boolean).join(" | "); 

                    return (
                        <tr key={assignment._id}>
                            <td>{roomData.floor}</td>
                            <td>{roomData.number}</td>
                            <td>{roomData.notes}</td>
                            <td>
                                {firstName} {lastName} ({affiliationNames}
                                {contactDetails ? `, ${contactDetails}` : ""})
                            </td>
                            <td>{period}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
