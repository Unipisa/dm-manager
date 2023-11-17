export function formatPersonName(person) {
    return person.firstName + " " + person.lastName +  
        " " + formatAffiliations(person.affiliations)
}

export function formatAffiliations(affiliations) {
    if (affiliations === undefined || affiliations.length == 0) {
        return ""
    }
    return "(" + affiliations.map(x => x.name).join(", ") + ")"
}

export function formatDatetime(datetime) {
    const date = new Date(datetime)

    // Consider passing en-us or it-it in place of undefined, if 
    // you want to force the locale.
    return date.toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "short", day: "numeric"
    })
}

export function truncateText(text, len) {
    if (text) {
        if (text.length > len) {
            return text.slice(0, len - 3) + "..."
        }
    }

    return text
}

export function getManageURL(path, query) {
    if (query === undefined) {
        query = ""
    }
    else {
        query = "?" + query
    }

    // FIXME: We will need a better logic here: for now we just 
    // detect local development, and default to the "official"
    // server in all other cases.
    if (window.location.host.match(/^localhost[:\d+]?/)) {
        return "http://localhost:8000/api/v0/" + path + query
    }
    else {
        return "https://manage.dm.unipi.it/api/v0/" + path + query;
    }
}