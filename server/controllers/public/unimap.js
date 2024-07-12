const fetch = require('node-fetch');
const config = require('../../config');

/** @param {import('@types/express').Request} req */
async function unimapQuery(req, res) {
    const { matricola } = req.params;
    if (!matricola) {
        return res.status(400).json({ error: 'Missing matricola' });
    }

    const id = matricola.substring(1);

    let anno = new Date().getFullYear();
    if (new Date().getMonth() < 10) {
        anno = anno - 1;
    }

    const fetchFromAPI = async (url, token, key, processFn = (data) => data) => {
        try {
            const apiResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (apiResponse.ok) {
                const data = await apiResponse.json();
                return processFn(data[key]);
            } else {
                return [];
            }
        } catch (error) {
            console.error(`Error fetching data from ${url}:`, error);
            return [];
        }
    };

    const fetchPromises = [
        fetchFromAPI(
            `${config.UNIPI_API_URL}registri/1.0/elenco/${id}?anno=${anno}`,
            config.UNIPI_TOKEN,
            'results',
            (results) => results?.registro ?? []
        ),        
        fetchFromAPI(
            `${config.UNIPI_API_URL}uniarpi/1.0/linkRicerca/${id}`,
            config.UNIPI_TOKENARPILINK,
            'linkToArpi',
            (link) => link ?? null
        ),
        fetchFromAPI(
            `${config.UNIPI_API_URL}arpicineca/1.0/getElencoPeriodo/${id}/${new Date().getFullYear()}`,
            config.UNIPI_TOKENARPI,
            'entries',
            (entries) => entries?.entry ?? []
        ),
        fetchFromAPI(
            `${config.UNIPI_API_URL}arpicineca/1.0/getElencoPeriodo/${id}/9999`,
            config.UNIPI_TOKENARPI,
            'entries',
            (entries) => entries?.entry ?? []
        )
    ];

    try {
        const [registri, arpiLink, arpiPublishedPapers, arpiAcceptedPapers] = await Promise.all(fetchPromises);

        res.json({
            registri,
            arpiLink,
            arpiPublishedPapers,
            arpiAcceptedPapers
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
}

module.exports = unimapQuery;