import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Ultra-Minimalist & Professional PDF Report Generator
 * Features exact column alignment, proportional width auto-fitting, auto-wrapping,
 * high-contrast professional headers, summary footers, and crisp multi-page running pagination.
 */
export const generatePdfReport = ({
  reportTitle = 'CRM Report',
  subtitle = 'Showroom Management System Report',
  branding = {},
  filtersText = 'All Records',
  summaryCards = [],
  columns = [],
  rows = [],
  footRow = null,
  fileName = 'CRM_Report.pdf',
  action = 'download', // 'download' | 'preview' | 'print'
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 12;
  const printableWidth = pageWidth - marginX * 2; // 186mm

  // Professional Palette
  const primaryBlue = branding.primaryColor || '#2563EB';

  let startY = 14;

  // 1. Company Brand Header Left
  const companyName = branding.appName || 'Vasantham Tiles & Sanitary Wares';
  const companySub = branding.tagline || 'Premium Showroom & Customer CRM';
  const companyAddress = branding.address || '124, Bypass Road, Near Bus Stand, Madurai, Tamil Nadu - 625001';
  const companyPhone = branding.phone || '+91 98401 23456';
  const companyGstin = branding.gstin ? ` • GSTIN: ${branding.gstin}` : '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(companyName, marginX, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139); // #64748B
  doc.text(companySub, marginX, startY + 4.5);
  doc.text(`${companyAddress} • Ph: ${companyPhone}${companyGstin}`, marginX, startY + 8.5);

  // 2. Report Title & Filter Info Right Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(reportTitle.toUpperCase(), pageWidth - marginX, startY, { align: 'right' });

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${dateFormatted} ${timeFormatted}`, pageWidth - marginX, startY + 4.5, {
    align: 'right',
  });
  doc.text(`Filters: ${filtersText}`, pageWidth - marginX, startY + 8.5, {
    align: 'right',
    maxWidth: 90,
  });

  startY += 13;

  // 3. Hairline Divider Line
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.3);
  doc.line(marginX, startY, pageWidth - marginX, startY);

  startY += 5;

// Helper to sanitize text for jsPDF standard fonts (replaces unsupported ₹ with Rs.)
const sanitizePdfText = (str) => {
  if (str === undefined || str === null) return '';
  return String(str).replace(/\u20B9/g, 'Rs. ').replace(/₹/g, 'Rs. ');
};

  // 4. Key Metric Summary Cards (Auto-Scaling font to strictly fit inside box without overflowing)
  if (summaryCards && summaryCards.length > 0) {
    const cardGap = 3.5;
    const totalGap = cardGap * (summaryCards.length - 1);
    const cardWidth = (printableWidth - totalGap) / summaryCards.length;
    const cardHeight = 14;
    const maxTextWidth = cardWidth - 6;

    summaryCards.forEach((card, index) => {
      const cardX = marginX + index * (cardWidth + cardGap);

      // Clean White Card Box
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top Color Accent Strip
      doc.setFillColor(card.color || primaryBlue);
      doc.rect(cardX, startY, cardWidth, 0.8, 'F');

      // Card Label with width constraint
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      let cleanLabel = sanitizePdfText(card.label).toUpperCase();
      if (doc.getTextWidth(cleanLabel) > maxTextWidth) {
        while (doc.getTextWidth(cleanLabel + '...') > maxTextWidth && cleanLabel.length > 5) {
          cleanLabel = cleanLabel.slice(0, -1);
        }
        cleanLabel += '...';
      }
      doc.text(cleanLabel, cardX + 3, startY + 5.2);

      // Card Value with dynamic font auto-scaling and ellipsis fallback
      const cleanValue = sanitizePdfText(card.value);
      let valFontSize = 9.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(valFontSize);
      doc.setTextColor(15, 23, 42);

      while (doc.getTextWidth(cleanValue) > maxTextWidth && valFontSize > 6) {
        valFontSize -= 0.5;
        doc.setFontSize(valFontSize);
      }

      let displayVal = cleanValue;
      if (doc.getTextWidth(displayVal) > maxTextWidth) {
        while (doc.getTextWidth(displayVal + '...') > maxTextWidth && displayVal.length > 3) {
          displayVal = displayVal.slice(0, -1);
        }
        displayVal += '...';
      }
      doc.text(displayVal, cardX + 3, startY + 10.8);
    });

    startY += cardHeight + 6;
  }

  // 5. Calculate Dynamic Proportional Column Widths to fill printableWidth (186mm) exactly with zero overflow
  const totalGivenWidth = columns.reduce((acc, col) => acc + (col.width || 25), 0);
  const columnStylesMap = {};
  let allocatedWidth = 0;
  columns.forEach((col, idx) => {
    let w;
    if (idx === columns.length - 1) {
      w = Math.max(12, Math.round((printableWidth - allocatedWidth) * 10) / 10);
    } else {
      w = Math.round(((col.width || 25) / totalGivenWidth) * printableWidth * 10) / 10;
      allocatedWidth += w;
    }
    columnStylesMap[idx] = {
      cellWidth: w,
      halign: col.align || 'left',
      overflow: 'linebreak',
    };
  });

  const formattedHeaders = columns.map((col) => sanitizePdfText(col.header));
  const formattedRows = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.dataKey];
      if (val === undefined || val === null || val === '') return '-';
      let str = sanitizePdfText(val);
      // Ensure comma-separated values (like requirements) wrap cleanly on linebreaks
      str = str.replace(/,([^\s])/g, ', $1');
      return str;
    })
  );

  const formattedFootRow = footRow && Array.isArray(footRow)
    ? footRow.map((cell) => sanitizePdfText(cell))
    : undefined;

  autoTable(doc, {
    startY: startY,
    head: [formattedHeaders],
    body: formattedRows,
    foot: formattedFootRow ? [formattedFootRow] : undefined,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59], // #1E293B
      lineColor: [226, 232, 240], // #E2E8F0
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
      minCellHeight: 5.5,
    },
    headStyles: {
      fillColor: [15, 23, 42], // Deep Charcoal (#0F172A) for authoritative executive contrast
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Subtle alternating row tint
    },
    columnStyles: columnStylesMap,
    margin: { left: marginX, right: marginX, top: 18, bottom: 16 },

    didParseCell: (data) => {
      const colStyle = columns[data.column.index];
      if (colStyle && colStyle.align) {
        data.cell.styles.halign = colStyle.align;
      }

      // Bold and right-align footer cells for Amount / Total
      if (data.section === 'foot') {
        data.cell.styles.fontStyle = 'bold';
        if (data.column.index === columns.length - 1) {
          data.cell.styles.textColor = [15, 23, 42];
          data.cell.styles.halign = 'right';
        }
      }

      // Color coding for status & priority badges in table body
      if (data.section === 'body') {
        const textVal = String(data.cell.text[0] || '').toUpperCase();

        if (
          textVal === 'WON' ||
          textVal === 'COMPLETED' ||
          textVal === 'ORDER CONFIRMED' ||
          textVal === 'CONFIRMED'
        ) {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald Green
          data.cell.styles.fontStyle = 'bold';
        } else if (
          textVal === 'LOST' ||
          textVal === 'OVERDUE' ||
          textVal === 'HIGH'
        ) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose Red
          data.cell.styles.fontStyle = 'bold';
        } else if (
          textVal === 'QUOTATION' ||
          textVal === 'QUOTED' ||
          textVal === 'PENDING' ||
          textVal === 'MEDIUM' ||
          textVal === 'NEGOTIATION'
        ) {
          data.cell.styles.textColor = [217, 119, 6]; // Amber Yellow
          data.cell.styles.fontStyle = 'bold';
        } else if (textVal === 'NEW' || textVal === 'NEW LEAD' || textVal === 'FOLLOW-UP') {
          data.cell.styles.textColor = [37, 99, 235]; // Royal Blue
          data.cell.styles.fontStyle = 'bold';
        }

        // If cell is in the amount / value column (right-aligned value)
        if (colStyle && colStyle.align === 'right' && (colStyle.header.includes('Amount') || colStyle.header.includes('Value'))) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [15, 23, 42];
        }
      }
    },

    didDrawPage: (data) => {
      // Running Page Footer
      const totalPages = doc.internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      // Bottom Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

      // Left Watermark / Footer Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Confidential • ${companyName} CRM Report`,
        marginX,
        pageHeight - 5
      );

      // Right Page Numbering
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        pageWidth - marginX,
        pageHeight - 5,
        { align: 'right' }
      );
    },
  });

  // Action Dispatching
  if (action === 'preview') {
    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank');
  } else if (action === 'print') {
    doc.autoPrint();
    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
};

/**
 * Utility to export tabular dataset to CSV spreadsheet format
 */
export const exportToCSV = (columns, rows, fileName = 'Report.csv') => {
  if (!rows || rows.length === 0) return;

  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  const rowData = rows.map((row) =>
    columns
      .map((col) => {
        const val = row[col.dataKey];
        const strVal = val !== undefined && val !== null ? String(val) : '';
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rowData].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
