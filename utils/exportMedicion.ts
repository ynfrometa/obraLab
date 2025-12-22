// No cargar las librerías en el nivel superior para evitar problemas con SSR

interface ConceptoItem {
  actividad: string;
  concepto: string;
  largo: string;
  alto: string;
  cantidad: string;
  total: string;
  observaciones?: string;
}

interface Medicion {
  id: string;
  empresaNombre?: string;
  empresaEmail?: string;
  empresaTelefono1?: string;
  empresaTelefono2?: string;
  constructora?: string;
  obra: string | string[]; // Puede ser string o array de strings
  fecha: string;
  conceptos?: ConceptoItem[];
}

export function exportToExcel(medicion: Medicion) {
  if (typeof window === 'undefined') {
    console.error('exportToExcel solo puede ejecutarse en el cliente');
    return;
  }
  
  // Cargar la librería solo cuando se necesite
  const XLSX = require('xlsx');
  
  // Crear un nuevo workbook
  const wb = XLSX.utils.book_new();

  // Crear los datos de la hoja
  const wsData: any[][] = [];

  // Fila 1: Vacía (margen superior)
  wsData.push([]);

  // Fila 2: Título "HOJA DE MEDICIONES" (fusionado en columnas B-F)
  wsData.push(['', 'HOJA DE MEDICIONES', '', '', '', '']);

  // Fila 3: Nombre de la empresa (columnas D-F, alineado a la derecha)
  wsData.push(['', '', '', medicion.empresaNombre || '', '', '']);

  // Fila 4: Email de la empresa (columnas D-F, alineado a la derecha)
  wsData.push(['', '', '', medicion.empresaEmail || '', '', '']);

  // Fila 5: Teléfonos (columnas D-F, alineado a la derecha)
  const telefonos = [medicion.empresaTelefono1, medicion.empresaTelefono2].filter(Boolean).join(', ');
  wsData.push(['', '', '', telefonos, '', '']);

  // Fila 6: Información del proyecto
  const fechaFormateada = medicion.fecha 
    ? (() => {
        const fecha = new Date(medicion.fecha + 'T00:00:00');
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      })()
    : '';
  
  // Manejar obra como string o array
  const obraTexto = Array.isArray(medicion.obra) 
    ? medicion.obra.filter(Boolean).join(' ')
    : medicion.obra || '';
  
  wsData.push(['', `Constructora: ${medicion.constructora || ''}`, `Obra: ${obraTexto}`, '', `Fecha: ${fechaFormateada}`, '']);

  // Fila 7: Vacía (separador)
  wsData.push([]);

  // Fila 8: Encabezados de la tabla
  wsData.push(['Actividad', 'Concepto', 'L', 'H', 'N', 'Total']);

  // Función para formatear números con comas como separador decimal
  const formatearNumero = (valor: string): string => {
    if (!valor || valor.trim() === '') return '';
    const num = parseFloat(valor.replace(',', '.'));
    if (isNaN(num)) return valor;
    return num.toFixed(2).replace('.', ',');
  };

  // Filas de datos
  if (medicion.conceptos && medicion.conceptos.length > 0) {
    medicion.conceptos.forEach((concepto) => {
      wsData.push([
        concepto.actividad || '',
        concepto.concepto || '',
        formatearNumero(concepto.largo),
        formatearNumero(concepto.alto),
        concepto.cantidad || '',
        formatearNumero(concepto.total || '0')
      ]);
    });
  }

  // Crear la hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar anchos de columnas
  ws['!cols'] = [
    { wch: 15 }, // A - Actividad
    { wch: 50 }, // B - Concepto
    { wch: 10 }, // C - L
    { wch: 10 }, // D - H
    { wch: 10 }, // E - N
    { wch: 12 }  // F - Total
  ];

  // Fusionar celdas y aplicar formato
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Título "HOJA DE MEDICIONES" fusionado en B2:F2 (fila 2, columnas B-F)
  ws['!merges'].push({ s: { r: 1, c: 1 }, e: { r: 1, c: 5 } });
  
  // Información de empresa fusionada (D3:F3, D4:F4, D5:F5)
  ws['!merges'].push({ s: { r: 2, c: 3 }, e: { r: 2, c: 5 } }); // Nombre empresa
  ws['!merges'].push({ s: { r: 3, c: 3 }, e: { r: 3, c: 5 } }); // Email
  ws['!merges'].push({ s: { r: 4, c: 3 }, e: { r: 4, c: 5 } }); // Teléfonos

  // Definir estilo de borde
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  // Función para aplicar bordes a una celda
  const aplicarBordes = (cell: any) => {
    if (cell && !cell.s) cell.s = {};
    if (cell && !cell.s.border) cell.s.border = borderStyle;
  };

  // Aplicar estilos y alineación
  // Título centrado, en negrita y con bordes
  const titleCell = ws['B2'];
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderStyle
    };
  }

  // Información de empresa alineada a la derecha y con bordes
  ['D3', 'D4', 'D5'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderStyle
      };
    }
  });

  // Información del proyecto con bordes
  ['B6', 'C6', 'E6'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.border = borderStyle;
    }
  });

  // Encabezados de tabla en negrita, centrados y con bordes
  ['A8', 'B8', 'C8', 'D8', 'E8', 'F8'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle
      };
    }
  });

  // Aplicar bordes a todas las celdas de datos de la tabla
  // Fila 8 es el encabezado (índice 7), los datos empiezan en fila 9 (índice 8)
  const headerRowIndex = 7; // Fila 8 en Excel (índice 0-based)
  const startDataRowIndex = 8; // Fila 9 en Excel (índice 0-based)
  const numConceptos = medicion.conceptos ? medicion.conceptos.length : 0;
  
  // Aplicar bordes a todas las celdas de datos
  for (let row = startDataRowIndex; row < startDataRowIndex + numConceptos; row++) {
    for (let col = 0; col < 6; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellRef];
      if (cell) {
        if (!cell.s) cell.s = {};
        cell.s.border = borderStyle;
        // Centrar columnas numéricas (L, H, N, Total) - columnas C, D, E, F (índices 2, 3, 4, 5)
        if (col >= 2) {
          if (!cell.s.alignment) cell.s.alignment = {};
          cell.s.alignment.horizontal = 'center';
          cell.s.alignment.vertical = 'center';
        }
      } else {
        // Si la celda no existe, crearla con el estilo
        ws[cellRef] = { 
          t: 's', 
          v: '', 
          s: { 
            border: borderStyle,
            alignment: col >= 2 ? { horizontal: 'center', vertical: 'center' } : {}
          } 
        };
      }
    }
  }

  // Aplicar bordes a las celdas fusionadas del título (B2:F2)
  ['B2', 'C2', 'D2', 'E2', 'F2'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.border = borderStyle;
    }
  });

  // Aplicar bordes a las celdas fusionadas de la empresa (D3:F3, D4:F4, D5:F5)
  ['D3', 'E3', 'F3', 'D4', 'E4', 'F4', 'D5', 'E5', 'F5'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.border = borderStyle;
    }
  });

  // Agregar la hoja al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja de Mediciones');

  // Generar el nombre del archivo
  const obraNombreArchivo = Array.isArray(medicion.obra) 
    ? medicion.obra.filter(Boolean).join('_')
    : medicion.obra || 'SinObra';
  const nombreArchivo = `Hoja_Mediciones_${obraNombreArchivo}_${fechaFormateada.replace(/\//g, '-')}.xlsx`;

  // Descargar el archivo
  XLSX.writeFile(wb, nombreArchivo);
}

export function exportToPDF(medicion: Medicion) {
  if (typeof window === 'undefined') {
    console.error('exportToPDF solo puede ejecutarse en el cliente');
    return;
  }
  
  try {
    // Cargar las librerías solo cuando se necesiten
    const { jsPDF } = require('jspdf');
    const autoTableModule = require('jspdf-autotable');
    
    // En jspdf-autotable v5+, necesitamos aplicar el plugin o usar la función directamente
    // Intentar aplicar el plugin si está disponible
    if (autoTableModule.applyPlugin && typeof autoTableModule.applyPlugin === 'function') {
      autoTableModule.applyPlugin(jsPDF);
    }
    
    const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Formatear fecha
  const fechaFormateada = medicion.fecha 
    ? (() => {
        const fecha = new Date(medicion.fecha + 'T00:00:00');
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      })()
    : '';

  // Título centrado
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const pageWidth = doc.internal.pageSize.getWidth();
  const titleText = 'HOJA DE MEDICIONES';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 20);

  // Información de la empresa (derecha)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let yPos = 30;
  if (medicion.empresaNombre) {
    doc.text(medicion.empresaNombre, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }
  if (medicion.empresaEmail) {
    doc.text(medicion.empresaEmail, pageWidth - 20, yPos, { align: 'right' });
    yPos += 7;
  }
  const telefonos = [medicion.empresaTelefono1, medicion.empresaTelefono2].filter(Boolean).join(', ');
  if (telefonos) {
    doc.text(telefonos, pageWidth - 20, yPos, { align: 'right' });
  }

  // Información del proyecto (izquierda)
  yPos = 30;
  // Manejar obra como string o array
  const obraTexto = Array.isArray(medicion.obra) 
    ? medicion.obra.filter(Boolean).join(' ')
    : medicion.obra || '';
  
  const projectInfo = [
    `Constructora: ${medicion.constructora || ''}`,
    `Obra: ${obraTexto}`,
    `Fecha: ${fechaFormateada}`
  ];
  projectInfo.forEach((info, index) => {
    doc.text(info, 20, yPos + (index * 7));
  });

  // Preparar datos de la tabla
  const tableData: any[][] = [];
  if (medicion.conceptos && medicion.conceptos.length > 0) {
    medicion.conceptos.forEach((concepto) => {
      tableData.push([
        concepto.actividad || '',
        concepto.concepto || '',
        concepto.largo || '',
        concepto.alto || '',
        concepto.cantidad || '',
        concepto.total || '0.00'
      ]);
    });
  }

    // Agregar tabla usando autoTable
    const tableOptions = {
      startY: 55,
      head: [['Actividad', 'Concepto', 'L', 'H', 'N', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Actividad
        1: { cellWidth: 80 }, // Concepto
        2: { cellWidth: 20 }, // L
        3: { cellWidth: 20 }, // H
        4: { cellWidth: 20 }, // N
        5: { cellWidth: 25 }  // Total
      },
      margin: { left: 20, right: 20 }
    };

    // Intentar usar autoTable del prototipo (después de aplicar el plugin)
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableOptions);
    } else {
      // Si no está disponible en el prototipo, intentar como función independiente
      const autoTable = autoTableModule.default || autoTableModule.autoTable || autoTableModule;
      if (typeof autoTable === 'function') {
        autoTable(doc, tableOptions);
      } else {
        throw new Error('No se pudo encontrar el método autoTable. Versión de jspdf-autotable: ' + autoTableModule);
      }
    }

    // Generar el nombre del archivo
    const obraNombreArchivo = Array.isArray(medicion.obra) 
      ? medicion.obra.filter(Boolean).join('_')
      : medicion.obra || 'SinObra';
    const nombreArchivo = `Hoja_Mediciones_${obraNombreArchivo}_${fechaFormateada.replace(/\//g, '-')}.pdf`;

    // Descargar el archivo
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF. Por favor, intenta de nuevo.');
  }
}




