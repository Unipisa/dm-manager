const Url = require('../models/Url')
const Controller = require('./Controller')

class UrlController extends Controller {
    constructor() {
        super(Url)
        this.path = 'url'
        this.searchFields = [ 'url', 'ref' ]
    }
}

module.exports = UrlController
