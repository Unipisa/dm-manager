import api from '../api'

export const dateToTimestamp = (date) => {
  return Math.floor(new Date(date).getTime() / 1000)
}

export const getBookingDetails = async (bookingId, process) => {
  try {
    const response = await api.post(`/api/v0/process/${process}/mrbsRoomsBookings`, {
      action: 'details',
      id: bookingId
    })
    return response
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export const queryAvailableRooms = async (startTime, endTime, process) => {
  try {
    const start = dateToTimestamp(startTime)
    const end = dateToTimestamp(endTime)

    const response = await api.post(`/api/v0/process/${process}/mrbsRoomsBookings`, {
      action: 'query',
      start_time: start,
      end_time: end
    })

    return response
  } catch (error) {
    console.error('Error querying available rooms:', error)
    throw error
  }
}

export const createBooking = async (bookingData, customDescription = null, process) => {
  try {
    const response = await api.post(`/api/v0/process/${process}/mrbsRoomsBookings`, {
      action: 'book',
      name: bookingData.name,
      room_id: bookingData.room_id,
      start_time: dateToTimestamp(bookingData.start_time),
      end_time: dateToTimestamp(bookingData.end_time),
      description: customDescription
    })
    return response
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

export const deleteBooking = async (bookingId, process) => {
  try {
    const response = await api.post(`/api/v0/process/${process}/mrbsRoomsBookings`, {
      action: 'delete',
      id: bookingId
    })
    return response
  } catch (error) {
    console.error('Error deleting booking:', error)
    throw error
  }
}

export const checkRoomAvailability = async (mrbsRoomId, startTime, endTime, process) => {
  try {
    const allAvailableRooms = await queryAvailableRooms(startTime, endTime, process)

    // Filter rooms to only include area_id 4 or 8 and exclude room_id 48 (Postazione videochiamate)
    // area_id 4 = Sala Riunioni, Aula Seminari Ex-Albergo, Aula Seminari, Sala Riunioni Piano Terra, Saletta Riunioni
    // area_id 8 = Aula Magna
    const availableRooms = allAvailableRooms.filter(room =>
      (room.area_id === 4 || room.area_id === 8) && room.id !== 48
    )

    const isRoomAvailable = availableRooms.some(room => room.id === mrbsRoomId)

    return {
      available: isRoomAvailable,
      conflictingBooking: null,
      availableRooms
    }
  } catch (error) {
    console.error('Error checking room availability:', error)
    throw error
  }
}

/**
 * Determines which time intervals need to be checked for availability when
 * modifying an existing booking. Only the *newly occupied* time is checked,
 * since the room is already held for the original interval.
 *
 * Returns an array of {start, end} intervals to check (may be empty if the
 * new window is fully contained within the old one).
 */
const getIntervalsToCheck = (newStart, newEnd, oldStart, oldEnd) => {
  const intervals = []

  const windowsOverlap = newStart < oldEnd && newEnd > oldStart

  if (!windowsOverlap) {
    // No overlap at all — check the entire new window
    intervals.push({ start: newStart, end: newEnd })
  } else {
    // New head: the part of the new window before the old one starts
    if (newStart < oldStart) {
      intervals.push({ start: newStart, end: oldStart })
    }

    // New tail: the part of the new window after the old one ends
    if (newEnd > oldEnd) {
      intervals.push({ start: oldEnd, end: newEnd })
    }
    
    // If newStart >= oldStart && newEnd <= oldEnd the booking was shortened
    // or unchanged → no new intervals need checking.
  }

  return intervals
}

/** De-duplicates a list of room objects by id. */
const dedupeRooms = (rooms) => {
  const seen = new Set()
  return rooms.filter(room => {
    if (seen.has(room.id)) return false
    seen.add(room.id)
    return true
  })
}

export const handleRoomBooking = async (eventData, process) => {
  const { conferenceRoom, startDatetime, duration, title, mrbsBookingID, organizers } = eventData

  if (!conferenceRoom?.mrbsRoomID) {
    return { type: 'external_room' }
  }

  const startTime = new Date(startDatetime)
  const endTime = new Date(startTime.getTime() + duration * 60000)

  const formatTime = (date) => date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (date) => date.toLocaleDateString('it-IT')

  const requiresApproval = conferenceRoom.mrbsRoomID === 33

  // ------------------------------------------------------------------
  // 1. Fetch existing booking (if any)
  // ------------------------------------------------------------------
  let existingBooking = null
  let hasBookingChanged = false

  if (mrbsBookingID) {
    try {
      const bookingResponse = await getBookingDetails(mrbsBookingID, process)
      if (bookingResponse) {
        existingBooking = bookingResponse
        hasBookingChanged =
          Math.floor(startTime.getTime() / 1000) !== parseInt(existingBooking.start_time) ||
          Math.floor(endTime.getTime() / 1000) !== parseInt(existingBooking.end_time) ||
          (!!title && existingBooking.name !== title)
      }
    } catch (error) {
      console.warn('Could not retrieve existing booking details:', error)
    }
  }

  try {
    // ------------------------------------------------------------------
    // 2. Determine which intervals actually need an availability check.
    //    For a brand-new booking the full window is checked.
    //    For an existing booking only the newly added time is checked.
    // ------------------------------------------------------------------
    let intervalsToCheck = []
    let skipCheck = false

    if (existingBooking) {
      const oldStart = new Date(existingBooking.start_time * 1000)
      const oldEnd   = new Date(existingBooking.end_time   * 1000)

      intervalsToCheck = getIntervalsToCheck(startTime, endTime, oldStart, oldEnd)
      skipCheck = intervalsToCheck.length === 0
    } else {
      intervalsToCheck = [{ start: startTime, end: endTime }]
    }

    // ------------------------------------------------------------------
    // 3. Run availability checks for each interval and merge results.
    // ------------------------------------------------------------------
    let isRoomAvailable = true
    let allAvailableRooms = []

    if (!skipCheck) {
      const results = await Promise.all(
        intervalsToCheck.map(({ start, end }) =>
          checkRoomAvailability(conferenceRoom.mrbsRoomID, start, end, process)
        )
      )

      isRoomAvailable = results.every(r => r.available)
      allAvailableRooms = dedupeRooms(results.flatMap(r => r.availableRooms || []))
    }

    const availableRoomNames = allAvailableRooms.map(room => room.name).join(', ')

    // ------------------------------------------------------------------
    // 4. Build and return the result object.
    // ------------------------------------------------------------------
    const isRoomActuallyAvailable = skipCheck || isRoomAvailable

    if (isRoomActuallyAvailable) {
      let message, warning

      if (existingBooking && hasBookingChanged) {
        const approvalSuffix = requiresApproval ? ' La prenotazione richiederà approvazione.' : ''
        message = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile per il periodo selezionato quindi anche la prenotazione sulla piattaforma Rooms verrà aggiornata.${approvalSuffix}`
        warning = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile sulla piattaforma Rooms per il periodo selezionato.${approvalSuffix}`
      } else if (existingBooking && !hasBookingChanged) {
        const startTimeFormatted = formatTime(new Date(parseInt(existingBooking.start_time) * 1000))
        const endTimeFormatted   = formatTime(new Date(parseInt(existingBooking.end_time)   * 1000))
        const dateFormatted      = formatDate(new Date(parseInt(existingBooking.start_time) * 1000))

        let approvalStatus = ''
        if (requiresApproval) {
          approvalStatus = existingBooking.awaiting_approval ? ' (in attesa di approvazione)' : ' (approvata)'
        }

        message = "No changes"
        warning = `C'è già una prenotazione sulla piattaforma Rooms associata a questo evento dal titolo "${existingBooking.name}" per il giorno ${dateFormatted} dalle ore ${startTimeFormatted} alle ${endTimeFormatted}${approvalStatus}.${availableRoomNames ? ` Le aule disponibili per il periodo selezionato sono: ${availableRoomNames}` : ''}`
      } else {
        const approvalSuffix = requiresApproval ? ' Questa aula richiede approvazione.' : ''
        message = `"${conferenceRoom.name}" è disponibile per il periodo selezionato. Vuoi effettuare la prenotazione sulla piattaforma Rooms?${approvalSuffix}`
        warning = `"${conferenceRoom.name}" è disponibile sulla piattaforma Rooms per il periodo selezionato.${approvalSuffix}`
      }

      return {
        type: 'available',
        message,
        warning,
        roomData: {
          room_id: conferenceRoom.mrbsRoomID,
          start_time: startTime,
          end_time: endTime,
          name: title,
          organizers: organizers || []
        },
        availableRoomNames: availableRoomNames ? `${availableRoomNames}.` : undefined
      }
    }

    // Room not available
    let message, warning

    if (existingBooking && hasBookingChanged) {
      const approvalNote = requiresApproval ? ' (questa aula richiede approvazione)' : ''
      message = `Hai cambiato i dettagli dell'evento ma l'aula "${conferenceRoom.name}" non è disponibile per il periodo selezionato${approvalNote}. Se salvi la prenotazione sulla piattaforma Rooms verrà cancellata. Le aule disponibili per quel periodo sono: ${availableRoomNames}. Vuoi tornare indietro e cambiare l'aula o vuoi salvare senza effettuare la prenotazione su Rooms?`
      warning = `Hai cambiato i dettagli dell'evento ma l'aula "${conferenceRoom.name}" non è disponibile sulla piattaforma Rooms per il periodo selezionato${approvalNote}. Se salvi la prenotazione verrà cancellata. Le aule disponibili sono: ${availableRoomNames}.`
    } else {
      const approvalNote = requiresApproval ? ' (questa aula richiede approvazione)' : ''
      message = `"${conferenceRoom.name}" non è disponibile per il periodo selezionato${approvalNote}. Le aule disponibili per quel periodo sono: ${availableRoomNames}. Vuoi tornare indietro e cambiare l'aula o vuoi salvare senza effettuare la prenotazione su Rooms?`
      warning = `"${conferenceRoom.name}" non è disponibile sulla piattaforma Rooms per il periodo selezionato${approvalNote}. Le aule disponibili sono: ${availableRoomNames}.`
    }

    return {
      type: 'unavailable',
      message,
      warning,
      availableRooms: allAvailableRooms,
      availableRoomNames: `${availableRoomNames}.`
    }

  } catch (error) {
    return {
      type: 'error',
      message: "Non è stato possibile verificare la disponibilità dell'aula. L'evento verrà salvato senza effettuare la prenotazione su Rooms.",
      warning: "Non è stato possibile verificare la disponibilità dell'aula sulla piattaforma Rooms.",
      error
    }
  }
}

export const getRoomBookingStatus = (roomBookingResult, mrbsBookingID) => {
  if (!roomBookingResult) return ''

  switch (roomBookingResult.type) {
    case 'external_room':
      return 'Aula esterna - non disponibile su Rooms'

    case 'available':
      if (roomBookingResult.message === "No changes") {
        return mrbsBookingID ? 'Prenotazione esistente valida' : 'Disponibile per prenotazione'
      }
      return 'Disponibile per prenotazione'

    case 'unavailable':
      return 'Non disponibile - conflitto orario'

    case 'error':
      return 'Errore nel controllo disponibilità'

    default:
      return ''
  }
}

export const createRoomBooking = async (roomData, process) => {
  try {
    const organizersNames = roomData.organizers && roomData.organizers.length > 0
      ? roomData.organizers.map(org => `${org.firstName} ${org.lastName}`).join(', ')
      : 'Unknown'

    const description = `Booked through the API via Manage by ${organizersNames}`

    const booking = await createBooking(roomData, description, process)
    return {
      success: true,
      bookingId: booking.booking.id,
      message: "L'aula è stata prenotata su Rooms!"
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: "Non è stato possibile effettuare la prenotazione. L'evento è stato salvato ma l'aula non è stata prenotata."
    }
  }
}