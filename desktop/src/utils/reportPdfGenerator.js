import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Ultra-Minimalist & Professional PDF Report Generator
 * Features exact column alignment (Right for currency, Center for codes/dates/statuses, Left for text),
 * auto-wrapping, header/footer alignment matching, summary footers, and crisp pagination.
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

  // Minimalist Palette
  const primaryBlue = branding.primaryColor || '#2563EB';

  let startY = 14;

  // 1. Brand Header Left
  const companyName = branding.appName || 'Vasantham Tiles & Sanitary Wares';
  const companySub = branding.tagline || 'Premium Showroom & Customer CRM';
  const companyAddress = branding.address || 'Main Showroom Road, Tamil Nadu, India';
  const companyPhone = branding.phone || '+91 98765 43210';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(companyName, marginX, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748B
  doc.text(companySub, marginX, startY + 5);
  doc.text(`${companyAddress} | Ph: ${companyPhone}`, marginX, startY + 9);

  // 2. Report Title & Timestamp Right Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235); // Primary Blue
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
  doc.text(`Generated: ${dateFormatted} ${timeFormatted}`, pageWidth - marginX, startY + 5, {
    align: 'right',
  });
  doc.text(`Filter: ${filtersText}`, pageWidth - marginX, startY + 9, { align: 'right' });

  startY += 15;

  // 3. Thin Hairline Divider
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.3);
  doc.line(marginX, startY, pageWidth - marginX, startY);

  startY += 5;

  // 4. Minimalist Summary Key Metric Cards (If provided)
  if (summaryCards && summaryCards.length > 0) {
    const cardGap = 3.5;
    const totalGap = cardGap * (summaryCards.length - 1);
    const cardWidth = (pageWidth - marginX * 2 - totalGap) / summaryCards.length;
    const cardHeight = 15;

    summaryCards.forEach((card, index) => {
      const cardX = marginX + index * (cardWidth + cardGap);

      // Clean White Card with Subtle Outline
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(cardX, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Top Accent Hairline
      doc.setFillColor(card.color || primaryBlue);
      doc.rect(cardX, startY, cardWidth, 1, 'F');

      // Card Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(String(card.label).toUpperCase(), cardX + 3.5, startY + 5.8);

      // Card Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(String(card.value), cardX + 3.5, startY + 11.8);
    });

    startY += cardHeight + 7;
  }

  // 5. Data Table Formatting (Auto-wrapped, crisp margins & pagination)
  const formattedHeaders = columns.map((col) => col.header);
  const formattedRows = rows.map((row) =>
    columns.map((col) => {
      const val = row[col.dataKey];
      return val !== undefined && val !== null ? String(val) : '-';
    })
  );

  autoTable(doc, {
    startY: startY,
    head: [formattedHeaders],
    body: formattedRows,
    foot: footRow ? [footRow] : undefined,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [51, 65, 85], // #334155
      lineColor: [226, 232, 240], // #E2E8F0
      lineWidth: 0.15,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249], // Clean #F1F5F9
      textColor: [15, 23, 42], // #0F172A
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: columns.reduce((acc, col, idx) => {
      const styleObj = { overflow: 'linebreak' };
      if (col.align) {
        styleObj.halign = col.align;
      }
      if (col.width) {
        styleObj.cellWidth = col.width;
      }
      acc[idx] = styleObj;
      return acc;
    }, {}),
    margin: { left: marginX, right: marginX, top: 18, bottom: 16 },

    // Format alignment and status badge styling per cell
    didParseCell: (data) => {
      const colStyle = columns[data.column.index];
      if (colStyle && colStyle.align) {
        data.cell.styles.halign = colStyle.align;
      }

      if (data.section === 'body') {
        const textVal = String(data.cell.text[0] || '').toUpperCase();

        if (textVal === 'WON' || textVal === 'COMPLETED' || textVal === 'ORDER CONFIRMED') {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald Green
          data.cell.styles.fontStyle = 'bold';
        } else if (textVal === 'LOST' || textVal === 'OVERDUE' || textVal === 'HIGH') {
          data.cell.styles.textColor = [225, 29, 72]; // Rose Red
          data.cell.styles.fontStyle = 'bold';
        } else if (textVal === 'QUOTED' || textVal === 'PENDING' || textVal === 'MEDIUM') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber Yellow
          data.cell.styles.fontStyle = 'bold';
        } else if (textVal === 'NEW') {
          data.cell.styles.textColor = [37, 99, 235]; // Blue
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },

    didDrawPage: (data) => {
      // 6. Running Minimalist Footer
      const totalPages = doc.internal.getNumberOfPages();
      const currentPage = data.pageNumber;

      // Bottom Hairline
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

      // Left Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Confidential • ${companyName} CRM Report`,
        marginX,
        pageHeight - 5
      );

      // Right Footer Page Numbering
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

  // Action Handling
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
 * Utility to export tabular dataset to CSV file format
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
