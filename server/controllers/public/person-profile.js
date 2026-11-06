// Public profile links depend on staff qualifications, not on having a person ID.
// Return only the eligibility flag; no additional staff details are exposed.
function personProfilePipeline() {
    return [
        { $lookup: {
            from: 'staffs', localField: '_id', foreignField: 'person', as: '_profileStaff',
            pipeline: [
                { $match: { $or: [{ isInternal: true }, { qualification: 'ex Docente' }] } },
                { $limit: 1 },
                { $project: { _id: 1 } },
            ],
        } },
        { $set: { hasPersonProfile: { $gt: [{ $size: '$_profileStaff' }, 0] } } },
        { $unset: '_profileStaff' },
    ];
}

module.exports = { personProfilePipeline };
