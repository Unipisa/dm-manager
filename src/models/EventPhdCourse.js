import { Route } from 'react-router-dom'
import { Link } from 'react-router-dom'

import ModelsPage from '../pages/ModelsPage'
import PhdCourseEditPage from '../pages/PhdCourseEditPage'
import PhdCourseViewPage from '../pages/PhdCourseViewPage'

/**
 * @typedef {{ 
 *      date: Date, 
 *      duration: number, 
 *      room: Room
 *  }} Lesson
 */

export default class EventPhdCourse {
    constructor() {
        this.ModelName = "EventPhdCourse"
        
        this.code = "event-phd-course"
        this.name = "corso di dottorato"
        this.oa = "o"
        this.articulation = {
            'oggetto': "corso di dottorato", 
            'oggetti': "corsi di dottorato",
            'l\'oggetto': "il corso di dottorato",
            'gli oggetti': "i corsi di dottorato", 
            'un oggetto': "un corso di dottorato", 
        }
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}
        this.columns = {
            'title': 'Titolo',
            'startDate': 'Data Inizio',
            'endDate': 'Data Fine',
            'lecturers': 'Docente/i',
        }

        this.schema = null

        this.IndexPage = ModelsPage
        this.ViewPage = PhdCourseViewPage
        this.EditPage = PhdCourseEditPage
    }

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    viewUrl(id) {return `/${this.code}/${id}`}

    // absolute url of object with given id
    editUrl(id) {return `/${this.code}/${id}/edit`}

    homeElements(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return [<Link to={this.indexUrl()}>Gestire i Corsi di Dottorato</Link>]
        } else if (user.hasSomeRole(...this.schema.supervisorRoles)) {
            return [<Link to={this.indexUrl()}>Visualizzare i Corsi di Dottorato</Link>]
        } else {
            return []
        }    
    }

    // brief description of given object
    describe(obj) {
        return `"${obj.title ?? '???'}"`;
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
