const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

// Helper to format hours consistently
const formatHours = (hours) => {
    if (hours === 0) return '-'
    return hours.toFixed(1).replace('.', ',')
}

// Day type labels for PDF (full names)
const DAY_TYPE_LABELS = {
    'weekday': 'Workday',
    'weekend': 'Weekend',
    'public-holiday': 'Holiday',
    'sick-leave': 'Sick Leave',
    'annual-holiday': 'Annual Leave',
    'other-absence': 'Other Absence',
}

async function generateTimesheetPDF(timesheet, monthData, year, month, res) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
    })

    // Register Titillium Web font if available
    try {
        const fontPath = path.join(__dirname, '../../../public/fonts/TitilliumWeb-Regular.ttf')
        const fontBoldPath = path.join(__dirname, '../../../public/fonts/TitilliumWeb-Bold.ttf')
        
        if (fs.existsSync(fontPath)) {
            doc.registerFont('Titillium', fontPath)
        }
        if (fs.existsSync(fontBoldPath)) {
            doc.registerFont('TitilliumBold', fontBoldPath)
        }
    } catch (err) {
        console.log('Titillium Web font not found, using default fonts')
    }

    // Helper to set fonts
    const regularFont = doc._registeredFonts?.Titillium ? 'Titillium' : 'Helvetica'
    const boldFont = doc._registeredFonts?.TitilliumBold ? 'TitilliumBold' : 'Helvetica-Bold'

    // Pipe to response
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 
        `attachment; filename="timesheet_${timesheet.employee.lastName}_${month}_${year}.pdf"`)
    doc.pipe(res)

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    // Page dimensions
    const pageWidth = 595.28  // A4 width in points
    const pageHeight = 841.89 // A4 height in points
    const margin = 40

    // Header - Logos and Title
    let currentY = margin

    try {
        // Left logo (matematica)
        const leftLogoPath = path.join(__dirname, '../../../public/img/matematica_dx_blu.png')
        if (fs.existsSync(leftLogoPath)) {
            doc.image(leftLogoPath, margin, currentY, { height: 40 })
        }

        // Right logo (UNIPI)
        const rightLogoPath = path.join(__dirname, '../../../public/img/marchio_unipi_orizz_pant541.png')
        if (fs.existsSync(rightLogoPath)) {
            doc.image(rightLogoPath, pageWidth - margin - 120, currentY, { height: 40 })
        }
    } catch (err) {
        console.error('Error loading logos:', err)
    }

    currentY += 50

    // Title
    doc.fontSize(18)
        .font(boldFont)
        .fillColor('#1A315D')
        .text(`Timesheet - ${monthNames[month - 1]} ${year}`, margin, currentY, { align: 'center' })
    doc.fillColor('#000000') 
    currentY += 20
    doc.fontSize(12).font(regularFont)
        .text(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, margin, currentY, { align: 'center' })
    currentY += 25

    // Employee info box - calculate height dynamically
    const boxX = margin
    let boxY = currentY
    const boxWidth = pageWidth - 2 * margin
    const leftColX = boxX + 10
    const rightColX = boxX + boxWidth / 2 + 10

    // Calculate box height by measuring content
    let contentY = 10 // padding top

    // Count lines needed
    const basicInfoLines = 3 // Employee, Fiscal Code, Role
    const grantsLines = timesheet.grants?.length || 0
    const rightColLines = 2 // Beneficiary, Head of Dept

    const lineHeight = 15
    const grantLineHeight = 10
    const paddingBottom = 10

    const leftColHeight = basicInfoLines * lineHeight + (grantsLines > 0 ? 15 + grantsLines * grantLineHeight : 0)
    const rightColHeight = rightColLines * lineHeight

    const boxHeight = Math.max(leftColHeight, rightColHeight) + paddingBottom + 10

    // Draw box with light gray background
    doc.fillColor('#F5F5F5').rect(boxX, boxY, boxWidth, boxHeight).fill()
    doc.strokeColor('#000000').rect(boxX, boxY, boxWidth, boxHeight).stroke()

    // Reset fill color for text
    doc.fillColor('#000000')
    
    currentY = boxY + 10
    doc.fontSize(9).font(regularFont)

    // Left column
    doc.font(boldFont).text('Employee:', leftColX, currentY)
    doc.font(regularFont).text(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, leftColX + 60, currentY)
    currentY += lineHeight

    doc.font(boldFont).text('Fiscal Code:', leftColX, currentY)
    doc.font(regularFont).text(timesheet.fiscalCode || '---', leftColX + 60, currentY)
    currentY += lineHeight

    doc.font(boldFont).text('Role:', leftColX, currentY)
    const roleText = timesheet.role === 'research' ? 'Research' : 'Administrative'
    const employmentTypeText = timesheet.employmentType === 'full-time' ? 'Full-time' : 'Part-time'
    doc.font(regularFont).text(`${roleText} (${employmentTypeText})`, leftColX + 60, currentY)
    currentY += lineHeight

    // Grants section
    if (timesheet.grants && timesheet.grants.length > 0) {
        currentY += 5
        doc.font(boldFont).text('Grants:', leftColX, currentY)
        currentY += 12
        doc.font(regularFont).fontSize(8)
        for (const grant of timesheet.grants) {
            const grantText = `• ${grant.name || grant.identifier} (${grant.identifier}${grant.projectType ? ', ' + grant.projectType : ''})`
            doc.text(grantText, leftColX + 5, currentY, { width: boxWidth - 25 })
            currentY += grantLineHeight
        }
        doc.fontSize(9)
    }

    // Right column - start from top again
    currentY = boxY + 10

    doc.font(boldFont).text('Beneficiary:', rightColX, currentY)
    const beneficiaryY = currentY
    doc.font(regularFont).text(timesheet.beneficiary || '---', rightColX + 65, currentY, { 
        width: boxWidth / 2 - 75 
    })
    currentY = Math.max(doc.y, beneficiaryY + lineHeight)

    doc.font(boldFont).text('Head of Dept:', rightColX, currentY)
    doc.font(regularFont).text(
        `${timesheet.headOfDepartment.firstName} ${timesheet.headOfDepartment.lastName}`, 
        rightColX + 65, currentY,
        { width: boxWidth / 2 - 75 }
    )

    // Move past the box
    currentY = boxY + boxHeight + 15

    // Table
    const tableTop = currentY
    const colWidths = {
        day: 28,
        type: 55,
    }

    // Calculate dynamic column widths for grants and activities
    const numGrants = timesheet.grants?.length || 0
    const fixedCols = 4 // Research/Admin, Teaching, Institutional, Other
    const totalCols = numGrants + fixedCols + 1 // +1 for Total
    const remainingWidth = pageWidth - 2 * margin - colWidths.day - colWidths.type
    const activityColWidth = Math.floor(remainingWidth / totalCols)

    // Calculate table height
    const numDays = monthData.days.length
    const rowHeight = 11
    const headerHeight_table = 22

    // Table headers with blue background (#1A315D or #225DD7)
    const headerColor = '#1A315D'
    doc.fontSize(7).font(boldFont)
    let xPos = margin

    // Day header
    doc.fillColor(headerColor).rect(xPos, tableTop, colWidths.day, headerHeight_table).fill()
    doc.strokeColor('#000000').rect(xPos, tableTop, colWidths.day, headerHeight_table).stroke()
    doc.fillColor('#FFFFFF').text('Day', xPos + 2, tableTop + 10, { 
        width: colWidths.day - 4, 
        align: 'center' 
    })
    xPos += colWidths.day

    // Type header
    doc.fillColor(headerColor).rect(xPos, tableTop, colWidths.type, headerHeight_table).fill()
    doc.strokeColor('#000000').rect(xPos, tableTop, colWidths.type, headerHeight_table).stroke()
    doc.fillColor('#FFFFFF').text('Type', xPos + 2, tableTop + 10, { 
        width: colWidths.type - 4, 
        align: 'center' 
    })
    xPos += colWidths.type

    // Grant headers
    for (const grant of timesheet.grants || []) {
        doc.fillColor(headerColor).rect(xPos, tableTop, activityColWidth, headerHeight_table).fill()
        doc.strokeColor('#000000').rect(xPos, tableTop, activityColWidth, headerHeight_table).stroke()
        const shortName = grant.identifier || grant.name?.substring(0, 10) || 'Grant'
        doc.fontSize(6).fillColor('#FFFFFF').text(shortName, xPos + 1, tableTop + 10, { 
            width: activityColWidth - 2, 
            align: 'center'
        })
        doc.fontSize(7)
        xPos += activityColWidth
    }

    // Fixed activity headers
    const roleLabel = timesheet.role === 'research' ? 'Institutional\nresearch' : 'Administrative\nactivities'
    const activityLabels = [
        roleLabel,
        'Teaching\nactivities',
        'Institutional\nactivities',
        'Other\nactivities'
    ]
    
    for (const label of activityLabels) {
        doc.fillColor(headerColor).rect(xPos, tableTop, activityColWidth, headerHeight_table).fill()
        doc.strokeColor('#000000').rect(xPos, tableTop, activityColWidth, headerHeight_table).stroke()
        doc.fontSize(6).fillColor('#FFFFFF').text(label, xPos + 1, tableTop + 6, { 
            width: activityColWidth - 2, 
            align: 'center',
            lineBreak: true
        })
        doc.fontSize(7)
        xPos += activityColWidth
    }

    // Total header
    doc.fillColor(headerColor).rect(xPos, tableTop, activityColWidth, headerHeight_table).fill()
    doc.strokeColor('#000000').rect(xPos, tableTop, activityColWidth, headerHeight_table).stroke()
    doc.fontSize(6).fillColor('#FFFFFF').text('Total', xPos + 1, tableTop + 10, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })
    doc.fontSize(7)

    // Reset colors for table body
    doc.fillColor('#000000')

    // Table rows
    let yPos = tableTop + headerHeight_table

    // Column totals
    const columnTotals = {
        grantHours: Array(numGrants).fill(0),
        roleHours: 0,
        teachingHours: 0,
        institutionalHours: 0,
        otherHours: 0,
        total: 0,
    }

    const NON_WORKING_TYPES = ['weekend', 'public-holiday', 'sick-leave', 'annual-holiday', 'other-absence']

    for (const day of monthData.days) {
        const isNonWorking = NON_WORKING_TYPES.includes(day.dayType)
        
        xPos = margin
        doc.font(regularFont)

        // Alternate row colors (#F0F0F0)
        if (day.day % 2 === 0) {
            const tableWidth = colWidths.day + colWidths.type + (numGrants + fixedCols + 1) * activityColWidth
            doc.fillColor('#F0F0F0').rect(margin, yPos, tableWidth, rowHeight).fill()
        }
        doc.fillColor('#000000')

        // Day number
        doc.rect(xPos, yPos, colWidths.day, rowHeight).stroke()
        doc.text(day.day.toString(), xPos + 2, yPos + 3, { 
            width: colWidths.day - 4, 
            align: 'center' 
        })
        xPos += colWidths.day

        // Type
        doc.rect(xPos, yPos, colWidths.type, rowHeight).stroke()
        doc.fontSize(6).text(DAY_TYPE_LABELS[day.dayType] || 'Workday', xPos + 1, yPos + 3, { 
            width: colWidths.type - 2, 
            align: 'center' 
        })
        doc.fontSize(7)
        xPos += colWidths.type

        let dayTotal = 0

        // Grant hours
        for (let i = 0; i < (timesheet.grants?.length || 0); i++) {
            const hours = day.grantHours?.[i]?.hours || 0
            doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
            if (!isNonWorking) {
                doc.text(formatHours(hours), xPos + 1, yPos + 3, { 
                    width: activityColWidth - 2, 
                    align: 'center' 
                })
                columnTotals.grantHours[i] += hours
                dayTotal += hours
            }
            xPos += activityColWidth
        }

        // Role hours
        const roleHours = day.roleHours || 0
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        if (!isNonWorking) {
            doc.text(formatHours(roleHours), xPos + 1, yPos + 3, { 
                width: activityColWidth - 2, 
                align: 'center' 
            })
            columnTotals.roleHours += roleHours
            dayTotal += roleHours
        }
        xPos += activityColWidth

        // Teaching hours
        const teachingHours = day.teachingHours || 0
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        if (!isNonWorking) {
            doc.text(formatHours(teachingHours), xPos + 1, yPos + 3, { 
                width: activityColWidth - 2, 
                align: 'center' 
            })
            columnTotals.teachingHours += teachingHours
            dayTotal += teachingHours
        }
        xPos += activityColWidth

        // Institutional hours
        const institutionalHours = day.institutionalHours || 0
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        if (!isNonWorking) {
            doc.text(formatHours(institutionalHours), xPos + 1, yPos + 3, { 
                width: activityColWidth - 2, 
                align: 'center' 
            })
            columnTotals.institutionalHours += institutionalHours
            dayTotal += institutionalHours
        }
        xPos += activityColWidth

        // Other hours
        const otherHours = day.otherHours || 0
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        if (!isNonWorking) {
            doc.text(formatHours(otherHours), xPos + 1, yPos + 3, { 
                width: activityColWidth - 2, 
                align: 'center' 
            })
            columnTotals.otherHours += otherHours
            dayTotal += otherHours
        }
        xPos += activityColWidth

        // Day total
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        if (!isNonWorking) {
            doc.font(boldFont)
            doc.text(formatHours(dayTotal), xPos + 1, yPos + 3, { 
                width: activityColWidth - 2, 
                align: 'center' 
            })
            doc.font(regularFont)
            columnTotals.total += dayTotal
        }

        yPos += rowHeight
    }

    // Totals row with blue background
    xPos = margin
    doc.font(boldFont)

    // Blue background for totals
    const tableWidth = colWidths.day + colWidths.type + (numGrants + fixedCols + 1) * activityColWidth
    doc.fillColor(headerColor).rect(margin, yPos, tableWidth, rowHeight).fill()
    doc.fillColor('#FFFFFF')

    // "Total" label spanning Day + Type columns
    const labelWidth = colWidths.day + colWidths.type
    doc.rect(xPos, yPos, labelWidth, rowHeight).stroke()
    doc.text('Total', xPos + 2, yPos + 3, { width: labelWidth - 4, align: 'center' })
    xPos += labelWidth

    // Grant totals
    for (let i = 0; i < columnTotals.grantHours.length; i++) {
        doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
        doc.text(formatHours(columnTotals.grantHours[i]), xPos + 1, yPos + 3, { 
            width: activityColWidth - 2, 
            align: 'center' 
        })
        xPos += activityColWidth
    }

    // Fixed activity totals
    doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
    doc.text(formatHours(columnTotals.roleHours), xPos + 1, yPos + 3, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })
    xPos += activityColWidth

    doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
    doc.text(formatHours(columnTotals.teachingHours), xPos + 1, yPos + 3, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })
    xPos += activityColWidth

    doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
    doc.text(formatHours(columnTotals.institutionalHours), xPos + 1, yPos + 3, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })
    xPos += activityColWidth

    doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
    doc.text(formatHours(columnTotals.otherHours), xPos + 1, yPos + 3, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })
    xPos += activityColWidth

    // Grand total
    doc.rect(xPos, yPos, activityColWidth, rowHeight).stroke()
    doc.text(formatHours(columnTotals.total), xPos + 1, yPos + 3, { 
        width: activityColWidth - 2, 
        align: 'center' 
    })

    // Reset colors
    doc.fillColor('#000000')
    yPos += rowHeight + 10

    // Activity description (only if provided)
    if (monthData.activityDescription && monthData.activityDescription.trim()) {
        doc.fontSize(9).font(boldFont)
        doc.text('Short description of the activities carried out in the month:', margin, yPos)
        yPos += 12
        doc.fontSize(8).font(regularFont)
        doc.text(monthData.activityDescription, margin, yPos, { 
            width: pageWidth - 2 * margin,
            align: 'justify'
        })
        yPos = doc.y + 5
    }

    // Ensure signatures are at the bottom with more space
    const signatureHeight = 90
    const sigY = pageHeight - margin - signatureHeight
    if (yPos < sigY) yPos = sigY

    // Warn user if available space will be exceeded
    const tableHeight = headerHeight_table + (numDays + 1) * rowHeight // +1 for totals row
    const availableSpace = pageHeight - tableTop - signatureHeight - 60 // 60 for description
    if (tableHeight > availableSpace) {
        console.warn(`Warning: Table height (${tableHeight}pt) may exceed available space (${availableSpace}pt)`)
    }

    // Signatures section
    doc.fontSize(9).font(regularFont)
    const sigWidth = (pageWidth - 3 * margin) / 2

    // Employee signature
    doc.font(boldFont).text(`Employee:`, margin, yPos)
    doc.font(regularFont).text(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`, 
        margin, yPos + 14, { width: sigWidth })
    
    doc.text('Date: _______________________________', margin, yPos + 35)
    doc.text('Signature: _______________________________', margin, yPos + 55)

    // Head of Department signature
    const rightX = margin + sigWidth + margin
    doc.font(boldFont).text(`Head of Department:`, rightX, yPos)
    doc.font(regularFont).text(`${timesheet.headOfDepartment.firstName} ${timesheet.headOfDepartment.lastName}`, 
        rightX, yPos + 14, { width: sigWidth })
    
    doc.text('Date: _______________________________', rightX, yPos + 35)
    doc.text('Signature: _______________________________', rightX, yPos + 55)

    // Finalize PDF
    doc.end()
}

module.exports = { generateTimesheetPDF }