const RoomAssignmentController = require('../RoomAssignmentController')
const RoomController = require('../RoomController')

// TODO: stiamo riutilizzando i controller
// di amministrazione. Bisognerebbe re-implementare tutto
// con il controllo giusto dei permessi

module.exports = (router) => {
    router.get('/roomAssignment', async (req, res) => {
        const controller = new RoomAssignmentController()
        await controller.index(req, res)
    })

    router.get('/room', async (req, res) => {
        const controller = new RoomController()
        await controller.index(req, res)
    })

    router.put('/roomAssignment', async (req, res) => {
        const controller = new RoomAssignmentController()
        await controller.put(req, res)
    })

    // TODO: non viene controllato se l'utente ha il permesso
    // di rimuovere l'assegnazione!
    router.delete('/roomAssignment/:id', async (req, res) => {
        const controller = new RoomAssignmentController()
        await controller.delete(req, res, req.params.id)
    })
}