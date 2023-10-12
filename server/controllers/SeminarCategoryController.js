const SeminarCategory = require('../models/SeminarCategory')
const Controller = require('./Controller')

class SeminarCategoryController extends Controller {
    constructor() {
        super(SeminarCategory)
        this.path = 'seminar-category'
        this.managerRoles.push('seminar-category-manager')
        this.supervisorRoles.push('seminar-category-manager', 'seminar-category-supervisor')
        // this.searchRoles = ['room-manager', 'room-supervisor']
        
        this.searchFields = ['name', 'label']
    }
}

module.exports = SeminarCategoryController