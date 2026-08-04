import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Register fonts
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

// ============================================================
// Types
// ============================================================
export interface BumdesProfile {
  storeName: string;
  storeAddress: string;
  direkturName: string;
  bendaharaName: string;
}

export interface ExportTableData {
  title: string;           // e.g. "LAPORAN LABA RUGI"
  headers: string[];       // column headers
  rows: (string | number)[][]; // data rows
  totalRow?: (string | number)[];  // optional bold total row
  subtotalRows?: number[]; // indices of rows that should be bold (subtotals)
}

// ============================================================
// Helpers
// ============================================================
const formatRupiah = (n: number): string => {
  if (n === 0) return '-';
  return `Rp ${Math.abs(n).toLocaleString('id-ID')}`;
};

const getPeriode = (): string => {
  const now = new Date();
  return `Tahun ${now.getFullYear()}`;
};

const sanitizeFileName = (s: string): string =>
  s.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

// ============================================================
// PDF Export
// ============================================================
export async function exportToPDF(
  data: ExportTableData,
  profile: BumdesProfile
): Promise<void> {
  const periode = getPeriode();
  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Build table body
  const headerRow: TableCell[] = data.headers.map((h, i) => ({
    text: h,
    style: 'tableHeader',
    alignment: i >= data.headers.length - 2 ? 'right' as const : 'left' as const
  }));

  const bodyRows: TableCell[][] = data.rows.map((row, rowIdx) => {
    const isBoldRow = data.subtotalRows?.includes(rowIdx);
    return row.map((cell, colIdx) => ({
      text: typeof cell === 'number' ? formatRupiah(cell) : String(cell),
      bold: !!isBoldRow,
      alignment: colIdx >= data.headers.length - 2 ? 'right' as const : 'left' as const,
      margin: [0, 2, 0, 2] as [number, number, number, number]
    }));
  });

  // Total row with double top border
  if (data.totalRow) {
    const totalCells: TableCell[] = data.totalRow.map((cell, colIdx) => ({
      text: typeof cell === 'number' ? formatRupiah(cell) : String(cell),
      bold: true,
      alignment: colIdx >= data.headers.length - 2 ? 'right' as const : 'left' as const,
      margin: [0, 4, 0, 4] as [number, number, number, number],
      border: [true, true, true, true] as [boolean, boolean, boolean, boolean]
    }));
    bodyRows.push(totalCells);
  }

  const colWidths = data.headers.map((_, i) => {
    if (i === 0) return 'auto';
    if (i === 1) return '*';
    return 'auto';
  });

  // Signature block
  const signatureBlock: Content = {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'Bendahara,', alignment: 'center' as const, margin: [0, 40, 0, 0] as [number, number, number, number] },
          { text: '\n\n\n', },
          { text: profile.bendaharaName || '____________________', alignment: 'center' as const, decoration: 'underline' as const }
        ]
      },
      {
        width: '*',
        stack: [
          { text: 'Direktur BUMDes,', alignment: 'center' as const, margin: [0, 40, 0, 0] as [number, number, number, number] },
          { text: '\n\n\n', },
          { text: profile.direkturName || '____________________', alignment: 'center' as const, decoration: 'underline' as const }
        ]
      }
    ]
  };

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 120, 40, 60],
    header: (currentPage: number, _pageCount: number): Content => {
      const headerContent: Content = {
        margin: [40, 20, 40, 0],
        stack: [
          { text: profile.storeName || 'BUMDes Noto Mulyo', style: 'headerTitle', alignment: 'center' as const },
          { text: profile.storeAddress || 'Desa Polodarat, Kec. Pecan', style: 'headerSubtitle', alignment: 'center' as const },
          { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 2 }] },
          ...(currentPage === 1 ? [
            { text: data.title, style: 'reportTitle', alignment: 'center' as const, margin: [0, 10, 0, 0] as [number, number, number, number] },
            { text: `Periode: ${periode}`, style: 'reportSubtitle', alignment: 'center' as const, margin: [0, 2, 0, 0] as [number, number, number, number] }
          ] : [
            { text: `${data.title} (lanjutan)`, style: 'reportSubtitle', alignment: 'center' as const, margin: [0, 8, 0, 0] as [number, number, number, number] }
          ])
        ]
      };
      return headerContent;
    },
    footer: (currentPage: number, pageCount: number): Content => ({
      columns: [
        { text: `Dicetak: ${tanggalCetak}`, alignment: 'left' as const, fontSize: 8, color: '#999', margin: [40, 0, 0, 0] as [number, number, number, number] },
        { text: `Halaman ${currentPage} / ${pageCount}`, alignment: 'right' as const, fontSize: 8, color: '#999', margin: [0, 0, 40, 0] as [number, number, number, number] }
      ]
    }),
    content: [
      {
        table: {
          headerRows: 1,
          widths: colWidths,
          body: [headerRow, ...bodyRows]
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1.5 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? '#333' : '#ccc',
          vLineColor: () => '#ccc',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 4,
          paddingBottom: () => 4
        }
      },
      signatureBlock
    ],
    styles: {
      headerTitle: { fontSize: 14, bold: true },
      headerSubtitle: { fontSize: 10, color: '#555' },
      reportTitle: { fontSize: 13, bold: true },
      reportSubtitle: { fontSize: 9, color: '#666' },
      tableHeader: { fontSize: 9, bold: true, fillColor: '#E2E8F0', color: '#1E293B', margin: [0, 4, 0, 4] }
    },
    defaultStyle: { fontSize: 9, font: 'Roboto' }
  };

  const fileName = `${sanitizeFileName(data.title)}_${sanitizeFileName(profile.storeName || 'BUMDes')}_${new Date().getFullYear()}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
}

// ============================================================
// Excel Export
// ============================================================
export async function exportToExcel(
  sheets: ExportTableData[],
  profile: BumdesProfile
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = profile.storeName || 'BUMDes Digital';
  wb.created = new Date();

  const periode = getPeriode();
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  for (const data of sheets) {
    const sheetName = data.title.replace(/[\\/*?:\[\]]/g, '').substring(0, 31);
    const ws = wb.addWorksheet(sheetName);

    // Header rows (kop)
    const kopRow1 = ws.addRow([profile.storeName || 'BUMDes Noto Mulyo']);
    kopRow1.font = { bold: true, size: 14 };
    kopRow1.alignment = { horizontal: 'center' };
    ws.mergeCells(1, 1, 1, data.headers.length);

    const kopRow2 = ws.addRow([profile.storeAddress || '']);
    kopRow2.font = { size: 10, color: { argb: 'FF666666' } };
    kopRow2.alignment = { horizontal: 'center' };
    ws.mergeCells(2, 1, 2, data.headers.length);

    const kopRow3 = ws.addRow([data.title]);
    kopRow3.font = { bold: true, size: 12 };
    kopRow3.alignment = { horizontal: 'center' };
    ws.mergeCells(3, 1, 3, data.headers.length);

    const kopRow4 = ws.addRow([`Periode: ${periode}`]);
    kopRow4.font = { size: 10, italic: true };
    kopRow4.alignment = { horizontal: 'center' };
    ws.mergeCells(4, 1, 4, data.headers.length);

    ws.addRow([]); // spacer

    // Table header
    const headerRow = ws.addRow(data.headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows
    data.rows.forEach((row, rowIdx) => {
      const excelRow = ws.addRow(row);
      const isBold = data.subtotalRows?.includes(rowIdx);
      excelRow.eachCell((cell, colNumber) => {
        cell.border = thinBorder;
        if (isBold) cell.font = { bold: true };
        if (typeof row[colNumber - 1] === 'number') {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Total row
    if (data.totalRow) {
      const totalExcelRow = ws.addRow(data.totalRow);
      totalExcelRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.border = {
          ...thinBorder,
          top: { style: 'double' }
        };
        if (typeof data.totalRow![colNumber - 1] === 'number') {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    }

    // Auto-width columns
    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellLen = cell.value ? String(cell.value).length : 0;
        if (cellLen > maxLen) maxLen = cellLen;
      });
      col.width = Math.min(maxLen + 4, 40);
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Laporan_Keuangan_${sanitizeFileName(profile.storeName || 'BUMDes')}_${new Date().getFullYear()}.xlsx`;
  saveAs(blob, fileName);
}
