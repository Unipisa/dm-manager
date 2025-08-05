import api from '../api'

export const dateToTimestamp = (date) => {
  return Math.floor(new Date(date).getTime() / 1000)
}

export const getBookingDetails = async (bookingId) => {
  try {
    const response = await api.post('/api/v0/process/mrbsRoomsBookings', {
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

export const queryAvailableRooms = async (startTime, endTime) => {
  try {
    const start = dateToTimestamp(startTime)
    const end = dateToTimestamp(endTime)

    const response = await api.post('/api/v0/process/mrbsRoomsBookings', {
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

export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/api/v0/process/mrbsRoomsBookings', {
      action: 'book',
      name: bookingData.name,
      room_id: bookingData.room_id,
      start_time: dateToTimestamp(bookingData.start_time),
      end_time: dateToTimestamp(bookingData.end_time)
    })
    return response
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

export const deleteBooking = async (bookingId) => {
  try {
    const response = await api.post('/api/v0/process/mrbsRoomsBookings', {
      action: 'delete',
      id: bookingId
    })
    return response
  } catch (error) {
    console.error('Error deleting booking:', error)
    throw error
  }
}

export const checkRoomAvailability = async (mrbsRoomId, startTime, endTime) => {
  try {
    const allAvailableRooms = await queryAvailableRooms(startTime, endTime)

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

export const handleRoomBooking = async (eventData) => {
  const { conferenceRoom, startDatetime, duration, title, mrbsBookingID } = eventData
  
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
    minute: '2-digit' 
  })
  const formatDate = (date) => date.toLocaleDateString('it-IT')
  
  // Check for existing booking first
  let existingBooking = null
  let hasBookingChanged = false
  
  if (mrbsBookingID) {
    try {
      const bookingResponse = await getBookingDetails(mrbsBookingID)
      if (bookingResponse) {
        existingBooking = bookingResponse
        const existingStartTime = new Date(parseInt(existingBooking.start_time) * 1000)
        const existingEndTime = new Date(parseInt(existingBooking.end_time) * 1000)
        
        // Check if booking details have changed
        hasBookingChanged = startTime.getTime() !== existingStartTime.getTime() || 
                           endTime.getTime() !== existingEndTime.getTime() ||
                           existingBooking.name !== title
      }
    } catch (error) {
      console.warn('Could not retrieve existing booking details:', error)
    }
  }

  try {
    const availability = await checkRoomAvailability(
      conferenceRoom.mrbsRoomID,
      startTime,
      endTime
    )

    const availableRoomNames = availability.availableRooms
      ?.map(room => room.name)
      .join(', ') || ''
    
    // If there's an existing booking, treat the room as available for this event
    const isRoomActuallyAvailable = availability.available || existingBooking
    
    if (isRoomActuallyAvailable) {
      let message, warning
      
      if (existingBooking && hasBookingChanged) {
        message = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile per il periodo selezionato quindi anche la prenotazione sulla piattaforma Rooms verrà aggiornata.`
        warning = `Hai cambiato i dettagli dell'evento. L'aula "${conferenceRoom.name}" è disponibile sulla piattaforma Rooms per il periodo selezionato.`
      } else if (existingBooking && !hasBookingChanged) {
        const startTimeFormatted = formatTime(new Date(parseInt(existingBooking.start_time) * 1000))
        const endTimeFormatted = formatTime(new Date(parseInt(existingBooking.end_time) * 1000))
        const dateFormatted = formatDate(new Date(parseInt(existingBooking.start_time) * 1000))
        
        message = "No changes"
        warning = `C'è già una prenotazione sulla piattaforma Rooms associata a questo evento dal titolo "${existingBooking.name}" per il giorno ${dateFormatted} dalle ore ${startTimeFormatted} alle ${endTimeFormatted}.${availableRoomNames ? ` Le aule disponibili per il periodo selezionato sono: ${availableRoomNames}` : ''}`
      } else {
        message = `"${conferenceRoom.name}" è disponibile per il periodo selezionato. Vuoi effettuare la prenotazione sulla piattaforma Rooms?`
        warning = `"${conferenceRoom.name}" è disponibile sulla piattaforma Rooms per il periodo selezionato.`
      }
      
      return {
        type: 'available',
        message,
        warning,
        roomData: {
          room_id: conferenceRoom.mrbsRoomID,
          start_time: startTime,
          end_time: endTime,
          name: title
        },
        availableRoomNames: availableRoomNames ? `${availableRoomNames}.` : undefined
      }
    } else {
      let message, warning
      
      if (existingBooking && hasBookingChanged) {
        message = `Hai cambiato i dettagli dell'evento ma l'aula "${conferenceRoom.name}" non è disponibile per il periodo selezionato. Se salvi la prenotazione sulla piattaforma Rooms verrà cancellata. Le aule disponibili per quel periodo sono: ${availableRoomNames}. Vuoi tornare indietro e cambiare l'aula o vuoi salvare senza effettuare la prenotazione su Rooms?`
        warning = `Hai cambiato i dettagli dell'evento ma l'aula "${conferenceRoom.name}" non è disponibile sulla piattaforma Rooms per il periodo selezionato. Se salvi la prenotazione verrà cancellata. Le aule disponibili sono: ${availableRoomNames}.`
      } else {
        message = `"${conferenceRoom.name}" non è disponibile per il periodo selezionato. Le aule disponibili per quel periodo sono: ${availableRoomNames}. Vuoi tornare indietro e cambiare l'aula o vuoi salvare senza effettuare la prenotazione su Rooms?`
        warning = `"${conferenceRoom.name}" non è disponibile sulla piattaforma Rooms per il periodo selezionato. Le aule disponibili sono: ${availableRoomNames}.`
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

export const createRoomBooking = async (roomData) => {
  try {
    const booking = await createBooking(roomData)
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