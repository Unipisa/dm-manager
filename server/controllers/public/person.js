const Person = require("../../models/Person")
const ObjectId = require('mongoose').Types.ObjectId
const fetch = require('node-fetch')
require('dotenv').config();

/** @param {import('@types/express').Request} req */
async function personQuery(req, res) {
    let _id;
    try {
        _id = new ObjectId(req.params.id);
    } catch {
        return res.status(404).json({ error: 'person not found' });
    }

    const pipeline = [
        { $match: { _id } },        
        {$lookup: {
            from: 'institutions',
            localField: 'affiliations',
            foreignField: '_id',
            as: 'affiliations'
        }},
        {$lookup: {
            from: 'staffs',
            localField: '_id',
            foreignField: 'person', 
            as: 'staffs',
            pipeline: [
                {$match: {
                    $expr: {
                        $and: [
                            { $or: [
                                { $eq: ["$endDate", null] },
                                { $gte: ["$endDate", "$$NOW"] } ]},
                            { $or: [
                                { $eq: ["$startDate", null] },
                                { $lte: ["$startDate", "$$NOW"] } ]}
                    ]},
                }},
            ]
        }},
        { $lookup: {
            from: 'roomassignments',
            localField: '_id',
            foreignField: 'person',
            as: 'roomAssignments',
            pipeline: [
                { $match: {
                    $expr: {
                        $and: [
                            { $or: [
                                { $eq: ["$endDate", null] },
                                { $gte: ["$endDate", "$$NOW"] } 
                            ]},
                            { $or: [
                                { $eq: ["$startDate", null] },
                                { $lte: ["$startDate", "$$NOW"] } 
                            ]}
                        ]
                    }
                }},
                { $lookup: {
                    from: 'rooms',
                    localField: 'room',
                    foreignField: '_id',
                    as: 'roomDetails'
                }},
                { $unwind: {
                    path: "$roomDetails",
                    preserveNullAndEmptyArrays: true
                }},
                { $project: {
                    room: 1,
                    startDate: 1,
                    endDate: 1,
                    roomDetails: {
                        building: 1,
                        floor: 1,
                        number: 1,
                        code: 1
                    }
                }}
            ]
        }},
        {$lookup: {
            from: 'groups',
            as: 'groups',
            let: { person_id: '$_id' },
            pipeline: [
                { $match: { $expr: {
                    $and: [
                        { $or: [ 
                            { $eq: [ "$$person_id", "$chair" ] },
                            { $eq: [ "$$person_id", "$vice" ] },
                            { $in: [ "$$person_id", "$members" ] }
                        ]},
                        { $or: [
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$NOW"] } ]},
                        { $or: [
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$NOW"] } ]}
                    ]}}                 
                },
                { 
                    $addFields: {
                        memberCount: { $size: "$members" }
                    }
                },
                {
                    $project: {
                        memberCount: 1,
                        name: 1,
                        chair: 1,
                        chair_title: 1,
                        vice: 1,
                        vice_title: 1
                    }
                }
            ]
        }},
        {$lookup: {
            from: 'grants',
            as: 'grants',
            let: { person_id: '$_id' },
            pipeline: [
                { $match: { $expr: {
                    $and: [
                        { $or: [ 
                            { $eq: [ "$$person_id", "$pi" ] },
                            { $eq: [ "$$person_id", "$localCoordinator" ] },
                            { $in: [ "$$person_id", "$members" ] }
                        ]},
                        { $or: [
                            { $eq: ["$endDate", null] },
                            { $gte: ["$endDate", "$$NOW"] } ]},
                        { $or: [
                            { $eq: ["$startDate", null] },
                            { $lte: ["$startDate", "$$NOW"] } ]}
                    ]}}                 
                },
                { $lookup: {
                    from: 'people',
                    localField: 'pi',
                    foreignField: '_id',
                    as: 'piDetails'
                }},
                { $unwind: {
                    path: "$piDetails",
                    preserveNullAndEmptyArrays: true
                }},
                { $project: {
                    name: 1,
                    projectType: 1,
                    pi: 1,
                    startDate: 1,
                    endDate: 1,
                    piDetails: {
                        firstName: 1,
                        lastName: 1
                    }
                }}
            ]
        }},
        {
            $project: {
                firstName: 1, 
                lastName: 1,
                affiliations: {
                    _id: 1,
                    name: 1,
                }, 
                gender: 1, 
                email: 1, 
                phone: 1, 
                personalPage: 1, 
                google_scholar: 1, 
                orcid: 1, 
                mathscinet: 1,
                arxiv_orcid: 1,
                photoUrl: 1,
                about_it: 1,
                about_en: 1,
                staffs: {
                    qualification: 1,
                    SSD: 1,
                    matricola: 1,
                    isInternal: 1
                },
                roomAssignments: {
                    room: 1,
                    startDate: 1,
                    endDate: 1,
                    roomDetails: {
                        building: 1,
                        floor: 1,
                        number: 1,
                        code: 1
                    }
                },
                groups: {
                    name: 1, 
                    chair: 1,
                    chair_title: 1,
                    vice: 1,
                    vice_title: 1,
                    memberCount: 1
                },
                grants: {
                    name: 1,
                    projectType: 1,
                    pi: 1,
                    startDate: 1,
                    endDate: 1,
                    piDetails: {
                        firstName: 1,
                        lastName: 1
                    }
                }
            }
        }
    ]

    const response = await Person.aggregate(pipeline)
    
    if (response.length == 0) {
        res.status(404).json({ 
            error: 'person not found'
        })
        return
    }

    const personData = response[0]

    const staff = personData.staffs.find(staff => staff.matricola);
    const id = staff ? staff.matricola.substring(1) : null;

    if (!id) {
        res.status(404).json({ 
            error: 'matricola not found'
        })
        return
    }

    let anno = new Date().getFullYear();
    if (new Date().getMonth() < 10) {
        anno = anno - 1;
    }

    try {
        const apiResponse = await fetch(`${process.env.UNIPI_API_URL}registri/1.0/elenco/${id}?anno=${anno}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.UNIPI_TOKEN}`
            }
        });

        if (apiResponse.ok) {
            const registri = await apiResponse.json();
            personData.registri = registri.results.registro || [];
        } else {
            personData.registri = [];
        }
    } catch (error) {
        console.error('Error fetching registri data:', error);
        personData.registri = [];
    }

    try {
        const arpiLinkResponse = await fetch(`${process.env.UNIPI_API_URL}uniarpi/1.0/linkRicerca/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.UNIPI_TOKENARPILINK}`
            }
        });

        if (arpiLinkResponse.ok) {
            const arpiData = await arpiLinkResponse.json();
            personData.arpiLink = arpiData.linkToArpi || null;
        } else {
            personData.arpiLink = null;
        }
    } catch (error) {
        console.error('Error fetching ARPI link:', error);
        personData.arpiLink = null;
    }

    try {
        const arpiResponse = await fetch(`${process.env.UNIPI_API_URL}arpicineca/1.0/getElencoPeriodo/${id}/${new Date().getFullYear()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.UNIPI_TOKENARPI}`
            }
        });

        if (arpiResponse.ok) {
            const arpiPublications = await arpiResponse.json();
            personData.arpiPublications = arpiPublications.entries.entry || [];
        } else {
            personData.arpiPublications = [];
        }
    } catch (error) {
        console.error('Error fetching ARPI publications data:', error);
        personData.arpiPublications = [];
    }

    res.json({
        data: personData
    });
}

module.exports = personQuery