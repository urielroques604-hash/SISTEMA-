import * as XLSX from 'xlsx';
import { Producto, Cliente, Proveedor, VentaRegistro, Credito, Abono, MovimientoCaja, CompraRegistro } from '../types';
import { obtenerTasaCambio } from './currency';

export interface DetalleHojaProcesada {
  nombre: string;
  tipo: 'productos' | 'clientes' | 'proveedores' | 'vacia';
  cantidad: number;
  descripcion: string;
}

export interface ResultadoImportacionExcel {
  success: boolean;
  mensaje: string;
  tipoDetectado: 'sistema_completo' | 'productos' | 'clientes' | 'proveedores' | 'desconocido';
  productos: Producto[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  ventas?: VentaRegistro[];
  creditos?: Credito[];
  abonos?: Abono[];
  caja?: MovimientoCaja[];
  compras?: CompraRegistro[];
  filasTotales: number;
  nombresHojas: string[];
  hojasDetalle: DetalleHojaProcesada[];
  hojaSeleccionada?: string;
  previewFilas?: any[];
}

/**
 * Normaliza nombres de encabezados para mapeo flexible
 */
function normalizarEncabezado(str: string): string {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Convierte un valor a número seguro
 */
function aNumero(val: any, defecto: number = 0): number {
  if (val === undefined || val === null || val === '') return defecto;
  if (typeof val === 'number') return isNaN(val) ? defecto : val;
  const limpio = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(limpio);
  return isNaN(num) ? defecto : num;
}

/**
 * Parsea un archivo Excel (.xlsx, .xls, .csv) y extrae AUTOMÁTICAMENTE los datos
 * de TODAS las hojas del libro sin obligar al usuario a elegir una hoja.
 */
export async function procesarArchivoExcel(file: File): Promise<ResultadoImportacionExcel> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        mensaje: 'El archivo Excel no contiene hojas de cálculo válidas.',
        tipoDetectado: 'desconocido',
        productos: [],
        clientes: [],
        proveedores: [],
        filasTotales: 0,
        nombresHojas: [],
        hojasDetalle: []
      };
    }

    const nombresHojas = workbook.SheetNames;
    const acumuladorProductos: Producto[] = [];
    const acumuladorClientes: Cliente[] = [];
    const acumuladorProveedores: Proveedor[] = [];
    const hojasDetalle: DetalleHojaProcesada[] = [];

    // Recorrer TODAS las hojas del archivo de forma automática
    for (const nombreHoja of nombresHojas) {
      const hojaTrabajo = workbook.Sheets[nombreHoja];
      if (!hojaTrabajo) continue;

      const filasRaw: any[] = XLSX.utils.sheet_to_json(hojaTrabajo, { defval: '' });
      if (!filasRaw || filasRaw.length === 0) {
        hojasDetalle.push({
          nombre: nombreHoja,
          tipo: 'vacia',
          cantidad: 0,
          descripcion: 'Hoja vacía sin filas con datos'
        });
        continue;
      }

      const primerFila = filasRaw[0] || {};
      const llavesNorm = Object.keys(primerFila).map(normalizarEncabezado);
      const nombreNorm = normalizarEncabezado(nombreHoja);

      // Detectar tipo de datos de esta hoja específica
      const esClientes = nombreNorm.includes('cliente') || 
        llavesNorm.some(k => k.includes('cliente') || (k.includes('nombre') && (k.includes('telefono') || k.includes('celular') || k.includes('direccion') || k.includes('contacto'))));

      const esProveedores = !esClientes && (nombreNorm.includes('proveedor') || 
        llavesNorm.some(k => k.includes('proveedor') || k.includes('empresa') || k.includes('ruc') || k.includes('distribuidor')));

      if (esClientes) {
        const clis = mapearFilasAClientes(filasRaw, acumuladorClientes.length);
        acumuladorClientes.push(...clis);
        hojasDetalle.push({
          nombre: nombreHoja,
          tipo: 'clientes',
          cantidad: clis.length,
          descripcion: `${clis.length} contactos de clientes`
        });
      } else if (esProveedores) {
        const provs = mapearFilasAProveedores(filasRaw, acumuladorProveedores.length);
        acumuladorProveedores.push(...provs);
        hojasDetalle.push({
          nombre: nombreHoja,
          tipo: 'proveedores',
          cantidad: provs.length,
          descripcion: `${provs.length} proveedores / distribuidores`
        });
      } else {
        // Asumir productos / inventario (Incluso múltiples hojas como "Vestidos", "Blusas", "Calzado", etc.)
        const prods = mapearFilasAProductos(filasRaw, nombreHoja, acumuladorProductos.length);
        acumuladorProductos.push(...prods);
        hojasDetalle.push({
          nombre: nombreHoja,
          tipo: 'productos',
          cantidad: prods.length,
          descripcion: `${prods.length} productos (Categoría: ${prods[0]?.categoria || nombreHoja})`
        });
      }
    }

    // Consolidar y deduplicar productos encontrados en todas las hojas
    const mapaProductos = new Map<string, Producto>();
    acumuladorProductos.forEach(p => {
      const key = p.codigo.trim().toLowerCase();
      if (mapaProductos.has(key)) {
        const actual = mapaProductos.get(key)!;
        actual.existencia += p.existencia;
        if (p.precioVenta > 0) actual.precioVenta = p.precioVenta;
        if (p.precioCompra > 0) actual.precioCompra = p.precioCompra;
      } else {
        mapaProductos.set(key, { ...p });
      }
    });
    const productos = Array.from(mapaProductos.values());

    // Deduplicar clientes por nombre
    const mapaClientes = new Map<string, Cliente>();
    acumuladorClientes.forEach(c => {
      const key = c.nombre.trim().toLowerCase();
      if (!mapaClientes.has(key)) {
        mapaClientes.set(key, c);
      }
    });
    const clientes = Array.from(mapaClientes.values());

    // Deduplicar proveedores por nombre
    const mapaProveedores = new Map<string, Proveedor>();
    acumuladorProveedores.forEach(pr => {
      const key = pr.nombre.trim().toLowerCase();
      if (!mapaProveedores.has(key)) {
        mapaProveedores.set(key, pr);
      }
    });
    const proveedores = Array.from(mapaProveedores.values());

    const filasTotales = productos.length + clientes.length + proveedores.length;

    if (filasTotales === 0) {
      return {
        success: false,
        mensaje: `Se leyeron ${nombresHojas.length} hojas pero ninguna contenía registros con encabezados reconocibles.`,
        tipoDetectado: 'desconocido',
        productos: [],
        clientes: [],
        proveedores: [],
        filasTotales: 0,
        nombresHojas,
        hojasDetalle
      };
    }

    let tipoDetectado: 'sistema_completo' | 'productos' | 'clientes' | 'proveedores' = 'productos';
    if ((productos.length > 0 && clientes.length > 0) || (productos.length > 0 && proveedores.length > 0)) {
      tipoDetectado = 'sistema_completo';
    } else if (clientes.length > 0 && productos.length === 0) {
      tipoDetectado = 'clientes';
    } else if (proveedores.length > 0 && productos.length === 0) {
      tipoDetectado = 'proveedores';
    }

    const preview = productos.length > 0 
      ? productos.slice(0, 6) 
      : (clientes.length > 0 ? clientes.slice(0, 6) : proveedores.slice(0, 6));

    const resumenHojas = hojasDetalle
      .filter(h => h.cantidad > 0)
      .map(h => `"${h.nombre}" (${h.cantidad})`)
      .join(', ');

    return {
      success: true,
      mensaje: `¡Todas las hojas se procesaron con éxito! Se extrajeron datos de: ${resumenHojas || 'todas las hojas'}.`,
      tipoDetectado,
      productos,
      clientes,
      proveedores,
      filasTotales,
      nombresHojas,
      hojasDetalle,
      hojaSeleccionada: 'Todas las hojas del archivo',
      previewFilas: preview
    };
  } catch (error) {
    console.error('Error al procesar archivo Excel:', error);
    return {
      success: false,
      mensaje: 'Error al leer el archivo Excel: ' + (error as Error).message,
      tipoDetectado: 'desconocido',
      productos: [],
      clientes: [],
      proveedores: [],
      filasTotales: 0,
      nombresHojas: [],
      hojasDetalle: []
    };
  }
}

/**
 * Mapea filas dinámicas de cualquier Excel a la estructura Producto[]
 */
export function mapearFilasAProductos(
  filas: any[], 
  nombreHojaDefault?: string,
  offsetIndice: number = 0
): Producto[] {
  const lista: Producto[] = [];

  // Categoría por defecto inferida del nombre de la hoja si no es genérico
  let catDefault = 'General';
  if (nombreHojaDefault) {
    const n = nombreHojaDefault.trim();
    const nNorm = normalizarEncabezado(n);
    if (!nNorm.startsWith('hoja') && !nNorm.startsWith('sheet') && !nNorm.startsWith('tabla') && nNorm !== 'inventario' && nNorm !== 'productos') {
      catDefault = n;
    }
  }

  filas.forEach((fila, idx) => {
    let codigo = '';
    let producto = '';
    let categoria = catDefault;
    let existencia = 0;
    let precioCompra = 0;
    let precioVenta = 0;
    let precioCompraCordobas: number | undefined = undefined;
    let precioVentaCordobas: number | undefined = undefined;
    let talla = '';
    let color = '';

    const tcGlobal = obtenerTasaCambio();

    for (const [colName, val] of Object.entries(fila)) {
      const norm = normalizarEncabezado(colName);
      const strVal = String(val !== undefined && val !== null ? val : '').trim();

      if (norm.includes('codigo') || norm === 'id' || norm === 'sku' || norm === 'cod' || norm === 'referencia') {
        codigo = strVal;
      } else if (norm.includes('producto') || norm.includes('descripcion') || norm.includes('nombre') || norm.includes('articulo') || norm.includes('item') || norm === 'prenda') {
        producto = strVal;
      } else if (norm.includes('categoria') || norm.includes('rubro') || norm.includes('departamento') || norm.includes('linea') || norm.includes('tipo')) {
        categoria = strVal || catDefault;
      } else if (norm.includes('existencia') || norm.includes('stock') || norm.includes('cantidad') || norm.includes('cant') || norm.includes('unidades')) {
        existencia = Math.max(0, Math.round(aNumero(val, 0)));
      } else if (norm.includes('preciocompracordoba') || norm.includes('costocordoba') || norm.includes('compracordoba') || norm.includes('compranio')) {
        precioCompraCordobas = aNumero(val, 0);
      } else if (norm.includes('precioventacordoba') || norm.includes('ventacordoba') || norm.includes('ventanio') || norm.includes('preciocordoba')) {
        precioVentaCordobas = aNumero(val, 0);
      } else if (norm.includes('preciocompra') || norm.includes('costo') || norm.includes('inversion') || norm === 'compra' || norm === 'cost') {
        precioCompra = aNumero(val, 0);
      } else if (norm.includes('precioventa') || norm.includes('precio') || norm.includes('pvp') || norm === 'venta' || norm === 'price') {
        precioVenta = aNumero(val, 0);
      } else if (norm.includes('talla') || norm.includes('size')) {
        talla = strVal;
      } else if (norm.includes('color')) {
        color = strVal;
      }
    }

    // Si solo venían precios en córdobas, convertirlos a dólares
    if (precioVenta <= 0 && precioVentaCordobas && precioVentaCordobas > 0 && tcGlobal > 0) {
      precioVenta = Number((precioVentaCordobas / tcGlobal).toFixed(2));
    }
    if (precioCompra <= 0 && precioCompraCordobas && precioCompraCordobas > 0 && tcGlobal > 0) {
      precioCompra = Number((precioCompraCordobas / tcGlobal).toFixed(2));
    }

    // Si no se detectó nombre ni código, omitir fila vacía
    if (!producto && !codigo) return;

    // Generar código autoincrementable si venía vacío
    if (!codigo) {
      codigo = `PRD-${String(offsetIndice + idx + 1).padStart(4, '0')}`;
    }

    // Enriquecer nombre con talla o color si están presentes y no en el título
    let nombreFinal = producto || `Producto ${codigo}`;
    const extras: string[] = [];
    if (talla && !nombreFinal.toLowerCase().includes(talla.toLowerCase())) {
      extras.push(`Talla ${talla}`);
    }
    if (color && !nombreFinal.toLowerCase().includes(color.toLowerCase())) {
      extras.push(color);
    }
    if (extras.length > 0) {
      nombreFinal = `${nombreFinal} (${extras.join(', ')})`;
    }

    // Ajustar si solo venía un precio
    if (precioVenta <= 0 && precioCompra > 0) {
      precioVenta = Number((precioCompra * 1.3).toFixed(2));
    } else if (precioCompra <= 0 && precioVenta > 0) {
      precioCompra = Number((precioVenta * 0.7).toFixed(2));
    }

    // Asegurar equivalentes en Córdobas
    if (!precioCompraCordobas && precioCompra > 0) {
      precioCompraCordobas = Number((precioCompra * tcGlobal).toFixed(2));
    }
    if (!precioVentaCordobas && precioVenta > 0) {
      precioVentaCordobas = Number((precioVenta * tcGlobal).toFixed(2));
    }

    lista.push({
      codigo,
      producto: nombreFinal,
      categoria: categoria || 'General',
      existencia: existencia,
      precioCompra: Number(precioCompra.toFixed(2)),
      precioCompraCordobas: precioCompraCordobas ? Number(precioCompraCordobas.toFixed(2)) : undefined,
      precioVenta: Number(precioVenta.toFixed(2)),
      precioVentaCordobas: precioVentaCordobas ? Number(precioVentaCordobas.toFixed(2)) : undefined
    });
  });

  return lista;
}

/**
 * Mapea filas dinámicas de cualquier Excel a la estructura Cliente[]
 */
export function mapearFilasAClientes(filas: any[], offsetIndice: number = 0): Cliente[] {
  const lista: Cliente[] = [];

  filas.forEach((fila, idx) => {
    let id = '';
    let nombre = '';
    let telefono = '';
    let direccion = '';
    let observaciones = '';

    for (const [colName, val] of Object.entries(fila)) {
      const norm = normalizarEncabezado(colName);
      const strVal = String(val !== undefined && val !== null ? val : '').trim();

      if (norm.includes('id') || norm.includes('codigo')) {
        id = strVal;
      } else if (norm.includes('nombre') || norm.includes('cliente') || norm.includes('contacto')) {
        nombre = strVal;
      } else if (norm.includes('telefono') || norm.includes('celular') || norm.includes('movil') || norm.includes('tel') || norm.includes('whatsapp')) {
        telefono = strVal;
      } else if (norm.includes('direccion') || norm.includes('domicilio') || norm.includes('ubicacion')) {
        direccion = strVal;
      } else if (norm.includes('observacion') || norm.includes('nota') || norm.includes('detalle')) {
        observaciones = strVal;
      }
    }

    if (!nombre) return;
    if (!id) id = `CLI-${String(offsetIndice + idx + 1).padStart(4, '0')}`;

    lista.push({
      id,
      nombre,
      telefono: telefono || '',
      direccion: direccion || '',
      observaciones: observaciones || ''
    });
  });

  return lista;
}

/**
 * Mapea filas dinámicas de cualquier Excel a la estructura Proveedor[]
 */
export function mapearFilasAProveedores(filas: any[], offsetIndice: number = 0): Proveedor[] {
  const lista: Proveedor[] = [];

  filas.forEach((fila, idx) => {
    let id = '';
    let nombre = '';
    let telefono = '';
    let direccion = '';
    let observaciones = '';

    for (const [colName, val] of Object.entries(fila)) {
      const norm = normalizarEncabezado(colName);
      const strVal = String(val !== undefined && val !== null ? val : '').trim();

      if (norm.includes('id') || norm.includes('codigo')) {
        id = strVal;
      } else if (norm.includes('nombre') || norm.includes('proveedor') || norm.includes('empresa') || norm.includes('distribuidor')) {
        nombre = strVal;
      } else if (norm.includes('telefono') || norm.includes('celular') || norm.includes('tel')) {
        telefono = strVal;
      } else if (norm.includes('direccion')) {
        direccion = strVal;
      } else if (norm.includes('observacion') || norm.includes('rubro')) {
        observaciones = strVal;
      }
    }

    if (!nombre) return;
    if (!id) id = `PRV-${String(offsetIndice + idx + 1).padStart(4, '0')}`;

    lista.push({
      id,
      nombre,
      telefono: telefono || '',
      direccion: direccion || '',
      observaciones: observaciones || ''
    });
  });

  return lista;
}

/**
 * Descarga una plantilla de ejemplo en Excel para que el usuario pueda llenar sus productos
 */
export function descargarPlantillaProductosExcel() {
  const wb = XLSX.utils.book_new();
  const ejemploProductos = [
    {
      'Código': 'PRD-001',
      'Producto': 'Vestido Casual Floral Talla M',
      'Categoría': 'Vestidos',
      'Existencia': 15,
      'Precio Compra': 12.50,
      'Precio Venta': 22.00
    },
    {
      'Código': 'PRD-002',
      'Producto': 'Blusa Elegante Seda Blanca',
      'Categoría': 'Blusas',
      'Existencia': 20,
      'Precio Compra': 8.00,
      'Precio Venta': 15.50
    },
    {
      'Código': 'PRD-003',
      'Producto': 'Pantalón Jean Skinny Azul Talla 30',
      'Categoría': 'Pantalones',
      'Existencia': 12,
      'Precio Compra': 16.00,
      'Precio Venta': 28.00
    },
    {
      'Código': 'PRD-004',
      'Producto': 'Cartera de Cuero Sintético Rosa',
      'Categoría': 'Accesorios',
      'Existencia': 8,
      'Precio Compra': 10.00,
      'Precio Venta': 18.00
    },
    {
      'Código': 'PRD-005',
      'Producto': 'Zapatos de Tacón Nude N° 37',
      'Categoría': 'Calzado',
      'Existencia': 6,
      'Precio Compra': 18.00,
      'Precio Venta': 32.00
    }
  ];

  const ws = XLSX.utils.json_to_sheet(ejemploProductos);
  ws['!cols'] = [
    { wch: 14 }, { wch: 36 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'Plantilla_Productos_VARIEDADES_CS.xlsx');
}

/**
 * Descarga una plantilla de ejemplo en Excel para clientes
 */
export function descargarPlantillaClientesExcel() {
  const wb = XLSX.utils.book_new();
  const ejemploClientes = [
    {
      'ID Cliente': 'CLI-0001',
      'Nombre': 'María Fernández',
      'Teléfono': '+503 7012-3456',
      'Dirección': 'Av. Central #12, San Salvador',
      'Observaciones': 'Cliente frecuente'
    },
    {
      'ID Cliente': 'CLI-0002',
      'Nombre': 'Carlos Menjívar',
      'Teléfono': '+503 7890-1234',
      'Dirección': 'Col. Escalón, Pasaje 3',
      'Observaciones': 'Crédito aprobado hasta $150'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(ejemploClientes);
  ws['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 18 }, { wch: 34 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'Plantilla_Clientes_VARIEDADES_CS.xlsx');
}
