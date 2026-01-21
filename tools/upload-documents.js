#!/usr/bin/env node 

const fs = require('fs');

async function makeRequest(root_url, method, endpoint, token, data) {
    const opts = {
        method: method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }

    if (data) {
        opts.body = JSON.stringify(data);
    }

    // console.log(`  -> Making request to ${root_url}${endpoint} with method ${method}`);
    const res = await fetch(`${root_url}${endpoint}`, opts);

    if (! res.ok) {
        const r = await res.json()
        console.log(`Error response: ${r.error}`);
        throw new Error(`HTTP error! status: ${res.status}`);

    }

    return res.json();
}

async function listDocuments(root_url, token) {
    return makeRequest(root_url, 'GET', '/api/v0/document', token, null);
}

async function createAttachment(root_url, token, attachment_url) {
    // Download the file from attachment_url to a temporary location
    const res = await fetch(attachment_url);
    if (! res.ok) {
        throw new Error(`Failed to download attachment from ${attachment_url}, status: ${res.status}`);
    }
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the file to the server
    const upload = await makeRequest(root_url, 'POST', '/api/v0/upload', token, { 
        // data needs to be base64 encoded
        data: buffer.toString('base64'),
        filename: attachment_url.split('/').pop(),
        mimetype: "application/pdf",
        private: true
    });

    if (! upload.upload) {
        throw new Error(`Failed to upload attachment from ${attachment_url}`);
    }

    return upload.upload;
}

async function uploadDocuments(root_url, token, file_path) {
    const fileContent = fs.readFileSync(file_path, 'utf-8');
    const data = JSON.parse(fileContent);

    const document_list = [];

    for (const doc of data.documents) {
        const name = doc.name;

        // Date needs to be parsed from DD-MM-YYYY
        const date = new Date(doc.date).toISOString();

        const new_doc = {
            name: name,
            date: date,
            description: doc.description || '',
            owners: doc.owners || [],
            access_codes: doc.access_codes || [],
            attachments: []
        }

        // Try to check if we already have a doument with the same name and date. If that is the case, skip it.
        // Note that we need to urlencode the name in the query

        const existing_docs = await makeRequest(root_url, 'GET', 
            '/api/v0/document?name=' + encodeURIComponent(name) + "&date=" + doc.date, 
            token, null);
        const exists = existing_docs.total > 0;

        if (exists) {
            document_list.push({
                _id: existing_docs["data"][0]._id,
                name: name,
                date: date
            })
            console.log(`Document ${name} with date ${date} already exists, skipping.`);
            continue;
        }

        console.log(`Uploading document: ${name} with date ${date}`);

        // Create all require attachments
        for (let i = 0; i < doc.attachments.length; i++) {
            const att = doc.attachments[i];
            console.log(`  Creating attachment from URL: ${att.url}`);
            const upload = await createAttachment(root_url, token, att.url);
            new_doc.attachments.push(upload._id);
            console.log(`  Created attachment with ID: ${upload._id}`);
        }

        // Create the document
        const created_doc = await makeRequest(root_url, 'PUT', '/api/v0/document', token, new_doc);
        console.log(`Created document with ID: ${created_doc._id}`);

        document_list.push({
            _id: created_doc._id,
            name: name,
            date: date
        })
    }

    return document_list;
}

// Read the command-line arguments, with the format upload-documents.js <root_url> <token> <file_path>
const [ , , root_url, token, file_path ] = process.argv;

if (!root_url || !token || !file_path) {
    console.error("Usage: node upload-documents.js <root_url> <token> <file_path>");
    console.error("");
    console.error("<file_path> is a JSON file with the format of example.json in this folder.");
    process.exit(1);
}

// Sample request to list the documents
const docs = uploadDocuments(root_url, token, file_path);

docs.then(async (docs) => {
    const file_content = fs.readFileSync(file_path, 'utf-8');
    const config = JSON.parse(file_content);

    const startYearTag = config.output?.startYearTag || "<h2>";
    const endYearTag = config.output?.endYearTag || "</h2>";
    const startListTag = config.output?.startListTag || "<ul>";
    const endListTag = config.output?.endListTag || "</ul>";

    docs.sort((a, b) => { new Date(b.date) - new Date(a.date) });

    console.log("Sample HTML list with the new links to be use in the website:");
    console.log("");


    const firstYear = (new Date(docs[0].date)).getFullYear();
    let currentYear = firstYear + 1;

    // Generate a random ID made of 5 integers
    let id = Math.floor(Math.random() * 100000);
    console.log(`${startYearTag.replace(/@UUID@/g, id)}${firstYear}${endYearTag.replace(/@UUID@/g, id)}`);

    console.log(`${startListTag.replace(/@UUID@/g, id)}`);
    for (const doc of docs) {
        if ((new Date(doc.date)).getFullYear() < currentYear) {
            currentYear = (new Date(doc.date)).getFullYear();
            console.log(`${endListTag}`);
            id = Math.floor(Math.random() * 100000);
            console.log(`${startYearTag.replace(/@UUID@/g, id)}${currentYear}${endYearTag.replace(/@UUID@/g, id)}`);
            console.log(`${startListTag.replace(/@UUID@/g, id)}`);
        }

        console.log(`<!-- wp:list-item --><li><a href="${root_url}/process/document/${doc._id}">${doc.name}</a> (${doc.date.split('T')[0]})</li><!-- /wp:list-item -->`);
    }
    console.log(`${endListTag}`)

}).catch((err) => {
    console.error("Error uploading documents:", err);
});
