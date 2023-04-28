import { Route } from 'react-router-dom'
import { Link } from 'react-router-dom'

import ModelViewPage from '../pages/ModelViewPage'
import ModelEditPage from '../pages/ModelEditPage'
import ModelsPage from '../pages/ModelsPage'
import ModelHomeElement from '../components/ModelHomeElement'

function capitalize(x) {
    if (x) {
        return x.charAt(0).toUpperCase() + x.slice(1);
    } else {
        return x
    }
}

export default class Model {
    constructor() {
        // string identifier of model
        this.code = null 

        // string name of Model (title case)
        this.modelName = null
    
        // italian name of model
        this.name = "oggetto"

        // italian gender identifier
        this.oa = "o"
        // or better:
        this.articulation = {
            'oggetto': "oggetto", 
            'oggetti': "oggetti",
            'l\'oggetto': "l'oggetto",
            'gli oggetti': "gli oggetti", 
            'un oggetto': "un oggetto", 
        }

        // initial filter of index page
        this.indexDefaultFilter = {'_sort': '-startDate', '_limit': 10}

        // columns in index page: {key: label}
        this.columns = {}

        // lo schema caricato dal server al momento 
        // della connessione (vedi Engine.js connect)
        this.schema = null

        // react element of index
        this.IndexPage = ModelsPage

        // react element of object view
        this.ViewPage = ModelViewPage

        // react element of object edit
        this.EditPage = ModelEditPage

        this.HomeElement = ModelHomeElement

        // Category to be used in the navbar 
        this.ModelCategory = null
    }

    // info about elements to be added into the menu bar
    menuElements(user) {
        if (user && this.schema && user.hasSomeRole(...this.schema.supervisorRoles)) {
            return [{
                key: this.code,
                url: this.indexUrl(), 
                text: capitalize(this.articulation['oggetti']),
                category: this.ModelCategory,
            }]
        } else {
            return []
        }    
    }

    // react elements to be inserted 
    // in the home page
    homeElements(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return [<Link to={this.indexUrl()}>gestire {this.articulation['gli oggetti']}</Link>]
        } else if (user.hasSomeRole(...this.schema.supervisorRoles)) {
            return [<Link to={this.indexUrl()}>visualizzare {this.articulation['gli oggetti']}</Link>]
        } else {
            return []
        }    
    }

    // brief description of given object
    describe(obj) { return "<object description not implemented>"}

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    viewUrl(id) {return `/${this.code}/${id}`}

    // absolute url of object with given id
    editUrl(id) {return `/${this.code}/${id}/edit`}

    onObjectChange(setObj) {}

    // react routers to object pages
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

        return [indexRouter, viewRouter, editRouter].filter(x => x)
    }    
}
