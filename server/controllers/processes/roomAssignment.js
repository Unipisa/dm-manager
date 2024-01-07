const RoomAssignmentController = require('../RoomAssignmentController')
const RoomController = require('../RoomController')

module.exports = (router) => {
    router.get('/roomAssignment', async (req, res) => {
        const controller = new RoomAssignmentController()
        await controller.index(req, res)
    })

    router.get('/room', async (req, res) => {
        const controller = new RoomController()
        await controller.index(req, res)
    })
}