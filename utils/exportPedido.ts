// No cargar las librerías en el nivel superior para evitar problemas con SSR

interface Pedido {
  id: string;
  fecha: string;
  descripcion: string;
  cantidad: string;
  costo: string;
  constructora: string;
  obra: string;
  empresa: string;
  proveedor: string;
  trabajador: string;
}

export function exportToExcel(pedido: Pedido) {
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

  // Formatear fecha
  const fechaFormateada = pedido.fecha 
    ? (() => {
        const fecha = new Date(pedido.fecha + 'T00:00:00');
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      })()
    : '';

  // Fila 1: Título "HOJA DE PEDIDOS" (fusionado en columnas E-H, índice 4-7)
  wsData.push(['', '', '', '', 'HOJA DE PEDIDOS', '', '', '', '']);

  // Fila 2: Encabezados de la tabla
  wsData.push([
    'Fecha',
    'Descripción',
    'Cantidad',
    'Constructora',
    'Obra',
    'Empresa',
    'Proveedor',
    'Trabajador',
    'Costo'
  ]);

  // Fila 3: Datos del pedido
  wsData.push([
    fechaFormateada,
    pedido.descripcion || '',
    pedido.cantidad || '',
    pedido.constructora || '',
    pedido.obra || '',
    pedido.empresa || '',
    pedido.proveedor || '',
    pedido.trabajador || '',
    pedido.costo || ''
  ]);

  // Crear la hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar anchos de columnas
  ws['!cols'] = [
    { wch: 12 }, // A - Fecha
    { wch: 25 }, // B - Descripción
    { wch: 10 }, // C - Cantidad
    { wch: 15 }, // D - Constructora
    { wch: 20 }, // E - Obra
    { wch: 15 }, // F - Empresa
    { wch: 15 }, // G - Proveedor
    { wch: 15 }, // H - Trabajador
    { wch: 12 }  // I - Costo
  ];

  // Fusionar celdas y aplicar formato
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Título "HOJA DE PEDIDOS" fusionado en E1:H1 (fila 1, columnas E-H, índices 4-7)
  ws['!merges'].push({ s: { r: 0, c: 4 }, e: { r: 0, c: 7 } });

  // Definir estilo de borde
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  // Aplicar estilos al título
  const titleCell = ws['E1'];
  if (titleCell) {
    titleCell.s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderStyle
    };
  }

  // Aplicar bordes a las celdas fusionadas del título (E1:H1)
  ['E1', 'F1', 'G1', 'H1'].forEach(cellRef => {
    const cell = ws[cellRef];
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.border = borderStyle;
    }
  });

  // Aplicar estilos a los encabezados (fila 2)
  const headerColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  headerColumns.forEach(col => {
    const cellRef = `${col}2`;
    const cell = ws[cellRef];
    if (cell) {
      cell.s = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderStyle
      };
    }
  });

  // Aplicar bordes a todas las celdas de datos (fila 3)
  headerColumns.forEach(col => {
    const cellRef = `${col}3`;
    const cell = ws[cellRef];
    if (cell) {
      if (!cell.s) cell.s = {};
      cell.s.border = borderStyle;
      // Centrar columnas numéricas (Cantidad, Costo) - columnas C e I
      if (col === 'C' || col === 'I') {
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
          alignment: (col === 'C' || col === 'I') ? { horizontal: 'center', vertical: 'center' } : {}
        } 
      };
    }
  });

  // Agregar la hoja al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja de Pedidos');

  // Generar el nombre del archivo
  const fechaArchivo = fechaFormateada.replace(/\//g, '-');
  const nombreArchivo = `Hoja_Pedidos_${pedido.descripcion?.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'SinDescripcion'}_${fechaArchivo}.xlsx`;

  // Descargar el archivo
  XLSX.writeFile(wb, nombreArchivo);
}

export function exportToPDF(pedido: Pedido) {
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
    const fechaFormateada = pedido.fecha 
      ? (() => {
          const fecha = new Date(pedido.fecha + 'T00:00:00');
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
    const titleText = 'HOJA DE PEDIDOS';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, 20);

    // Preparar datos de la tabla
    const tableData = [[
      fechaFormateada,
      pedido.descripcion || '',
      pedido.cantidad || '',
      pedido.constructora || '',
      pedido.obra || '',
      pedido.empresa || '',
      pedido.proveedor || '',
      pedido.trabajador || '',
      pedido.costo || ''
    ]];

    // Agregar tabla usando autoTable
    const tableOptions = {
      startY: 30,
      head: [['Fecha', 'Descripción', 'Cantidad', 'Constructora', 'Obra', 'Empresa', 'Proveedor', 'Trabajador', 'Costo']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' }, // Fecha
        1: { cellWidth: 40 }, // Descripción
        2: { cellWidth: 20, halign: 'center' }, // Cantidad
        3: { cellWidth: 30 }, // Constructora
        4: { cellWidth: 35 }, // Obra
        5: { cellWidth: 30 }, // Empresa
        6: { cellWidth: 30 }, // Proveedor
        7: { cellWidth: 25 }, // Trabajador
        8: { cellWidth: 20, halign: 'center' }  // Costo
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
    const fechaArchivo = fechaFormateada.replace(/\//g, '-');
    const nombreArchivo = `Hoja_Pedidos_${pedido.descripcion?.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'SinDescripcion'}_${fechaArchivo}.pdf`;

    // Descargar el archivo
    doc.save(nombreArchivo);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF. Por favor, intenta de nuevo.');
  }
}

