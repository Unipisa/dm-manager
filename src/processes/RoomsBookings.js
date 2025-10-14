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
    
    // Check if the requested room is in the available rooms list
    const isRoomAvailable = availableRooms.some(room => room.id === mrbsRoomId)
    
    let conflictingBooking = null
    if (!isRoomAvailable) {
      // If room is not available, we could try to get more details
      // For now, we'll just indicate it's not available
    }
    
    return {
      available: isRoomAvailable,
      conflictingBooking,
      availableRooms
    }
  } catch (error) {
    console.error('Error checking room availability:', error)
    throw error
  }
}

export const handleRoomBooking = async (eventData, process) => {
  const { conferenceRoom, startDatetime, duration, title, mrbsBookingID, organizers } = eventData
  
  // Check if the conference room has an mrbsRoomID
  if (!conferenceRoom?.mrbsRoomID) {
    return {
      type: 'external_room'
    }
  }
  
  const startTime = new Date(startDatetime)
  const endTime = new Date(startTime.getTime() + duration * 60000) // duration in minutes
  
  const formatTime = (date) => date.toLocaleTimeString('it-IT', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC'
  })
  const formatDate = (date) => date.toLocaleDateString('it-IT', {
    timeZone: 'UTC'
  })
  
  // Check if this room requires approval
  // room 33 is Aula Magna
  const requiresApproval = conferenceRoom.mrbsRoomID === 33

  // Check for existing booking first
  let existingBooking = null
  let hasBookingChanged = false
  
  if (mrbsBookingID) {
    try {
      const bookingResponse = await getBookingDetails(mrbsBookingID, process)
      if (bookingResponse) {
        existingBooking = bookingResponse
        
        // Check if booking details have changed
        hasBookingChanged = Math.floor(startTime.getTime() / 1000) !== parseInt(existingBooking.start_time) || 
                           Math.floor(endTime.getTime() / 1000) !== parseInt(existingBooking.end_time) ||
                           (!!title && existingBooking.name !== title)
      }
    } catch (error) {
      console.warn('Could not retrieve existing booking details:', error)
    }
  }

  try {
    const availability = await checkRoomAvailability(
      conferenceRoom.mrbsRoomID,
      startTime,
      endTime,
      process
    )

    const availableRoomNames = availability.availableRooms
      ?.map(room => room.name)
      .join(', ') || ''
    
    // If there's an existing booking, treat the room as available for this event
    const isRoomActuallyAvailable = availability.available || existingBooking
    
    if (isRoomActuallyAvailable) {
      let message, warning
      
      if (existingBooking && hasBookingChanged) {
        const approvalSuffix = requiresApproval ? ' La prenotazione richiederà approvazione.' : ''
        message = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile per il periodo selezionato quindi anche la prenotazione sulla piattaforma Rooms verrà aggiornata.${approvalSuffix}`
        warning = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile sulla piattaforma Rooms per il periodo selezionato.${approvalSuffix}`
      } else if (existingBooking && !hasBookingChanged) {
        const startTimeFormatted = formatTime(new Date(parseInt(existingBooking.start_time) * 1000))
        const endTimeFormatted = formatTime(new Date(parseInt(existingBooking.end_time) * 1000))
        const dateFormatted = formatDate(new Date(parseInt(existingBooking.start_time) * 1000))
        
        let approvalStatus = ''
        if (requiresApproval) {
          if (existingBooking.awaiting_approval) {
            approvalStatus = ' (in attesa di approvazione)'
          } else {
            approvalStatus = ' (approvata)'
          }
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
    } else {
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
        availableRooms: availability.availableRooms,
        availableRoomNames: `${availableRoomNames}.`
      }
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