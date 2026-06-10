import Model from './Model'
import TimesheetViewPage from '../pages/TimesheetViewPage'

export default class Timesheet extends Model {
    constructor() {
        super()
        this.code = 'timesheet'
        this.name = "timesheet"
        this.oa = "o"
        this.articulation = {
            'oggetto': "timesheet", 
            'oggetti': "timesheet",
            'l\'oggetto': "il timesheet",
            'gli oggetti': "i timesheet", 
            'un oggetto': "un timesheet", 
        }
        this.ModelName = 'Timesheet'
        this.indexDefaultFilter = {'_sort': 'employee', '_limit': 10}
        this.columns = {
            'employee': 'Dipendente',
            'startDate': 'Data Inizio',
            'endDate': 'Data Fine',
            'grants': 'Grant'
        }
        this.ViewPage = TimesheetViewPage 
    }

    describe(obj) { 
        return `${obj?.employee?.lastName} ${obj?.employee?.firstName}` 
    }
}