import { Route } from 'react-router-dom'
import { Link } from 'react-router-dom'

import ModelEditPage from '../pages/ModelEditPage'
import ModelsPage from '../pages/ModelsPage'
import ModelViewPage from '../pages/ModelViewPage'

export default class EventConference {
    constructor() {
        this.ModelName = "EventConference"
        
        this.code = "event-conference"
        this.name = "conferenza"
        this.oa = "a"
        this.articulation = {
            'oggetto': "conferenza", 
            'oggetti': "conferenze",
            'l\'oggetto': "la conferenza",
            'gli oggetti': "le conferenze", 
            'un oggetto': "una conferenza", 
        }
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.columns = {
            'title': 'Titolo',
            'startDate': 'Data Inizio',
            'endDate': 'Data Fine',
            'SSD': 'SSD',
            'conferenceRoom': 'Stanza',
        }

        this.schema = null

        this.IndexPage = ModelsPage
        this.ViewPage = ModelViewPage
        this.EditPage = ModelEditPage
    }

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    viewUrl(id) {return `/${this.code}/${id}`}

    // absolute url of object with given id
    editUrl(id) {return `/${this.code}/${id}/edit`}

    // info about elements to be added into the menu bar
    menuElements(user) {
        return user && this.schema && user.hasSomeRole(...this.schema.supervisorRoles) ? [
            {
                key: this.code,
                url: this.indexUrl(), 
                text: 'Conferenze',
                category: 'eventi',
            },
        ] : [];
    }

    homeElements(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return [<Link to={this.indexUrl()}>Gestire le Conferenze</Link>]
        } else if (user.hasSomeRole(...this.schema.supervisorRoles)) {
            return [<Link to={this.indexUrl()}>Visualizzare le Conferenza</Link>]
        } else {
            return []
        }    
    }

    // brief description of given object
    describe(obj) {
        return `"${obj.title}"`;
    }

    onObjectChange(setObj) {}

    routers() {
        const MyModelsPage = ({ Model }) => {
            // react component to render index page
            // cannot use directly ModelsPage because
            // otherwise react thinks it is the same component
            // for each model
            return <ModelsPage Model={Model} />
        }

        let MyIndex = null 
        if (this.IndexPage === ModelsPage) MyIndex = MyModelsPage
        else if (this.IndexPage) MyIndex = this.IndexPage

        const indexRouter = MyIndex
            && <Route path={this.indexUrl()} element={<MyIndex Model={this}/>} />
        const viewRouter = this.ViewPage
            && <Route path={this.viewUrl(":id")} element={<this.ViewPage Model={this}/>} />
        const editRouter = this.EditPage  
            && <Route path={this.editUrl(":id")} element={<this.EditPage Model={this}/>} />

        return [indexRouter, viewRouter, editRouter].filter(Boolean)
    }    
}
