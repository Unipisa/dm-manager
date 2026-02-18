/**
 * Italian public holidays
 * Format: "MM-DD" for fixed holidays
 * Easter and Easter Monday are calculated dynamically
 */

const FIXED_HOLIDAYS = [
    '01-01', // Capodanno
    '01-06', // Epifania
    '04-25', // Festa della Liberazione
    '05-01', // Festa dei Lavoratori
    '06-02', // Festa della Repubblica
    '08-15', // Ferragosto
    '11-01', // Ognissanti
    '12-08', // Immacolata Concezione
    '12-25', // Natale
    '12-26', // Santo Stefano
]

// Calculate Easter Sunday using Anonymous Gregorian algorithm
function getEaster(year) {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31)
    const day = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(year, month - 1, day)
}

function isItalianHoliday(date) {
    const d = new Date(date)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${month}-${day}`
    
    // Check fixed holidays
    if (FIXED_HOLIDAYS.includes(key)) return true
    
    // Check Easter and Easter Monday
    const easter = getEaster(d.getFullYear())
    const easterMonday = new Date(easter)
    easterMonday.setDate(easter.getDate() + 1)
    
    const isEaster = d.toDateString() === easter.toDateString()
    const isEasterMonday = d.toDateString() === easterMonday.toDateString()
    
    return isEaster || isEasterMonday
}

module.exports = { isItalianHoliday }