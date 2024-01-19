const ConferenceRoomController = require('../ConferenceRoomController')

module.exports = (router) => {
    router.get('/conference-room/search', async (req, res) => {
        const controller = new ConferenceRoomController()
        await controller.search(req, res)
    })
}
