import React from 'react'

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

export function formatDate(datetime) {
    const date = new Date(datetime)

    // Consider passing en-us or it-it in place of undefined, if 
    // you want to force the locale.
    return date.toLocaleDateString(isEnglish() ? 'en' : 'it', {
        weekday: "long", year: "numeric", month: "short", day: "numeric"
    })
}

export function formatDateInterval(start, end) {
    if (start != end) {
        return formatDate(start) + " - " + formatDate(end);
    }
    else {
        return formatDate(start);
    }
}

export function formatTime(datetime) {
    const date = new Date(datetime)

    // Consider passing en-us or it-it in place of undefined, if 
    // you want to force the locale.
    return date.toLocaleTimeString(undefined, {
        timeStyle: "short"
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

export function truncateTextByWords(text, maxWords) {
    if (! text) {
        return ""
    }
    let words = text.split(' ');

    if (maxWords >= words.length) {
        return text;  
    }

    let truncatedWords = words.slice(0, maxWords);
    let truncatedText = truncatedWords.join(' ');
    truncatedText += '...';

    return truncatedText;
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
    if (! dmwidgets.localDevelopment) {
        return "https://manage.dm.unipi.it/api/v0/" + path + query;
    }
    else {
        return "/api/v0/" + path + query
    }
}


// See https://wpml.org/forums/topic/how-to-determine-the-active-language-with-js/
function getCookie(c_name) {
    var c_value = document.cookie,
        c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) c_start = c_value.indexOf(c_name + "=");
    if (c_start == -1) {
        c_value = null;
    } else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
}

export function isEnglish() {
    const wpml = getCookie('wp-wpml_current_language')
    return wpml == 'en'
}

export function getDMURL(path) {
    const wpml = getCookie('wp-wpml_current_language')

    if (!path || path[0] != '/') {
        path = '/' + path
    }

    // Note: this only works while the elements are embedded in the 
    // Wordpress page, as the cookies are not accessible otherwise.
    if (wpml == 'en') {
        return "https://www.dm.unipi.it/en" + path
    }
    else {
        return "https://www.dm.unipi.it" + path
    }
}

export function getSSDLink(SSD) {
    var label = ""

    switch (SSD) {
        case "MAT/01":
            label = "Mathematical Logic"
            break;
        case "MAT/02":
            label = "Algebra"
            break;
        case "MAT/03":
            label = "Geometry"
            break;
        case "MAT/04":
            label = "Mathematics Education and History of Mathematics"
            break;
        case "MAT/05":
            label = "Mathematical Analysis"
            break;
        case "MAT/06":
            label = "Probability and Mathematical Statistics"
            break;
        case "MAT/07":
            label = "Mathematical Physics"
            break;
        case "MAT/08":
            label = "Numerical Analysis"
            break;
        case "MAT/09":
            label = "Operation Research"
            break;
    }
    
    if (label != "") {
        return <a key={"SSD-link-" + SSD} href={"https://www.dm.unipi.it/en/conferences?SSD=" + SSD.replace("/", "%2F")}>{SSD}</a>
    }

    return ""
}
