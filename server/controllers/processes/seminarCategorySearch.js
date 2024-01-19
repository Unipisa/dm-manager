const SeminarCategoryController = require('../SeminarCategoryController')

module.exports = (router) => {
    router.get('/seminar-category/search', async (req, res) => {
        const controller = new SeminarCategoryController()
        await controller.search(req, res)
    })
}
