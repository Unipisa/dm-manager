const express = require('express')
const RoomAssignment = require('../../models/RoomAssignment')
const router = express.Router()

module.exports = router

const INDEX_PIPELINE = [
    {
        $lookup: {
            from: "rooms",
            localField: "room",
            foreignField: "_id",
            as: "room",
        }
    },
    { 
        $lookup: {
            from: 'people',
            localField: 'person',
            foreignField: '_id',
            as: 'person',
            pipeline: [
                {
                    $lookup: {
                        from: 'institutions',
                        localField: 'affiliations',
                        foreignField: '_id',
                        as: 'affiliations',
                        pipeline: [
                            { $project: { _id: 1, name: 1 }} 
                        ]
                    }
                },
                { 
                    $project: { 
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        email: 1,
                        phone: 1,
                        affiliations: 1 
                    }
                }
            ]
        }
    },
    { 
        $unwind: {
            path: '$person',
            preserveNullAndEmptyArrays: true,
        }
    },
    { 
        $project: {
            "startDate": 1,
            "endDate": 1,
            "room._id": 1,
            "room.code": 1,
            "room.building": 1,
            "room.floor": 1,
            "room.number": 1,
            "person": 1 
        }
    }
];

module.exports.INDEX_PIPELINE = INDEX_PIPELINE;

router.get('/', async (req, res) => {    
    const data = await RoomAssignment.aggregate([
        { $match: {
            $expr: { 
              $and: [
                { $or: [ {$eq: ['$endDate', null]}, {$gte: ['$endDate', '$$NOW']}]},
              ]
            }
          }
        },
        ...INDEX_PIPELINE,
    ])

    res.json({ data })
})
