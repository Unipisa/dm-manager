import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import { Card } from 'react-bootstrap'

const queryClient = new QueryClient()

export default function ManageSeminars() {

    return (
        <QueryClientProvider client={queryClient}>
            <SeminarList></SeminarList>
        </QueryClientProvider>
    )
}

function SeminarList() {
    const { isLoading, error, data } = useQuery('process/seminars', async () => {
        return await (await fetch('/api/v0/process/seminars')).json()
    })

    if (isLoading) {
        return "Loading"
    }

    if (error) {
        return "Error: " + error.message
    }

    var seminar_block = []

    for (var i = 0; i < data.data.length; i++) {
        const seminar = data.data[i]
        const speaker = seminar.speaker
        seminar_block.push(
            <div className="p-3 col-lg-6 p-0">
            <Card className="shadow" key={"seminar-" + seminar._id}>
                <Card.Header className="h6">Seminario</Card.Header>
                <Card.Body>
                    <strong>Titolo</strong>: {seminar.title} <br></br>
                    <strong>Speaker</strong>: {speaker.firstName} { speaker.lastName } ({speaker.affiliations.map(x => x.name).join(", ")})<br></br>
                    <strong>Data</strong>: {seminar.startDatetime}<br></br>
                    <div className="mt-2 d-flex flex-row justify-content-end">
                        <a href={"/process/seminars/add/" + seminar._id}>
                            <button className="btn btn-primary">
                                Edit
                            </button>
                        </a>
                    </div>
                </Card.Body>                
            </Card>
            </div>
        )
    }

    return <>
        <h1 className="text-primary pb-0">Gestione seminari</h1>
        <a href="/process/seminars/add">
            <button className="btn btn-primary my-3">Nuovo seminario</button>
        </a>
        <div className="row">
            {seminar_block}
        </div>
    </>
}