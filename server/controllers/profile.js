const Staff = require('../models/Staff')
const Person = require('../models/Person')

module.exports = function profile(router, path) {
    router.get(path, async (req, res) => {
        const user = req.user || null
        const pipeline = [
            { $match: { email: user.email } },
            { $project: { notes: 0 }},
            { $lookup: {
                from: "staffs",
                localField: "_id",  
                foreignField: "person",
                as: "staffs",
                pipeline: [
                    { $project: { notes: 0 }},
                ],
            }}
        ]
        const people = (user.email ? await Person.aggregate(pipeline) : [])
        
        if (user) {
            res.send({
                user,
                people,
            })
        } else {
            res.status(401).send({error: "Not authenticated"})
        }
    })
}
