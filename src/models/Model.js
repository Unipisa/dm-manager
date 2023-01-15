import { Route, Link, NavLink } from 'react-router-dom'

import ModelPage from '../pages/ModelPage'
import ModelsPage from '../pages/ModelsPage'

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

        // the react component used to render
        // object details
        this.ObjectDetails = null

        // lo schema caricato dal server al momento 
        // della connessione (vedi Engine.js connect)
        this.schema = null

        // if null use ModelsPage as IndexPage element
        this.IndexPage = null
    }

    Index() {
        // react component to render index page
        // cannot use directly IndexPage
        // otherwise react thinks it is the same component
        // for each model
        const MyIndexPage = () => {
            return <ModelsPage Model={this} />
        }

        return <MyIndexPage />
    }

    Page() {
        return <ModelPage
            ModelName = { this.ModelName }
            objCode = { this.code }
            objName = { this.name }
            indexUrl = { this.indexUrl() }
            oa = { this.oa }
            describe = { this.describe.bind(this) }
            onChange = { this.onObjectChange.bind(this) }
            Details = { this.ObjectDetails }
        />
    }

    // brief description of given object
    describe(obj) { return "<object description not implemented>"}

    // absolute url of objects index
    indexUrl() {return `/${this.code}`}
    
    // absolute url of object with given id
    pageUrl(id) {return `/${this.code}/${id}`}

    onObjectChange(setObj) {}

    // react routers to object pages
    routers() {
        const Model = this
        
        function MyIndex() {
            // react component to render index page
            // cannot use directly IndexPage
            // otherwise react thinks it is the same component
            // for each model
            const MyIndexPage = () => {
                return <ModelsPage Model={Model} />
            }
    
            if (Model.IndexPage) return <Model.IndexPage />
            return <MyIndexPage />
        }
    
        return [
          <Route path={this.pageUrl(":id")} element={this.Page()} />,
          <Route path={this.indexUrl()} element={MyIndex()} />
        ]
    }    

    // return a react element to be inserted in 
    // the home page
    homeElement(user) {
        if (user.hasSomeRole(...this.schema.managerRoles)) {
            return <Link to={this.indexUrl()}>gestire {this.articulation['gli oggetti']}</Link>
        } else if (user.hasSomeRole(...this.schema.supervisorRoles)) {
            return <Link to={this.indexUrl()}>visualizzare {this.articulation['gli oggetti']}</Link>
        } else {
            return null
        }
    }

    // return a menu element to be inserted in
    // the header bar
    menuElement(user) {
        if (user && user.hasSomeRole(...this.schema.supervisorRoles)) {
            return <NavLink key={this.code} to={this.indexUrl()} className="nav-link">
                {this.articulation['oggetti']}
            </NavLink>
        } else {
            return null
        }
    }
}
