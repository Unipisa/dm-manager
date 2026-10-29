const Group = require('../../models/Group')
const ObjectId = require('mongoose').Types.ObjectId

async function groupQuery(req, res) {
    let _id;
    try {
        _id = new ObjectId(req.params.id);
    } catch {
        return res.status(404).json({ error: 'Group not found' });
    }

    const personPipeline = [
        { $lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations',
            pipeline: [{ $project: { name: 1 } }]
        } },
        { $lookup: {
            from: 'staffs',
            localField: '_id',
            foreignField: 'person',
            as: 'staffs',
            pipeline: [
                { $match: { $expr: { $and: [
                    { $or: [{ $eq: ['$endDate', null] }, { $gte: ['$endDate', '$$NOW'] }] },
                    { $or: [{ $eq: ['$startDate', null] }, { $lte: ['$startDate', '$$NOW'] }] }
                ] } } },
                { $project: { _id: 0, isInternal: 1 } }
            ]
        } },
        { $project: {
            firstName: 1, lastName: 1, email: 1, personalPage: 1,
            affiliations: 1, staffs: 1
        } }
    ];

    const pipeline = [
        { $match: { _id } },
        ...['chair', 'vice', 'members'].map(field => ({ $lookup: {
            from: 'people',
            localField: field,
            foreignField: '_id',
            as: field,
            pipeline: personPipeline
        } })),
        { $unwind: { path: '$chair', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$vice', preserveNullAndEmptyArrays: true } },
        { $project: { chair: 1, chair_title: 1, vice: 1, vice_title: 1, members: 1 } }
    ];

    const groups = await Group.aggregate(pipeline);
    if (groups.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
    }
    return res.json({ data: groups[0] });
}

module.exports = groupQuery
