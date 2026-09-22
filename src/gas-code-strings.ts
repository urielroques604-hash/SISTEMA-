// Código oficial completo de Código.gs
export const CODIGO_GS = `/**
 * =========================================================================
 * VARIEDADES CS - Inventario y Ventas
 * Sistema de Inventario y Punto de Venta para Google Apps Script & Google Sheets
 * =========================================================================
 */

const HOJAS = {
  PRODUCTOS: 'Productos',
  MOVIMIENTOS: 'Movimientos',
  VENTAS: 'Ventas',
  COMPRAS: 'Compras',
  CLIENTES: 'Clientes',
  PROVEEDORES: 'Proveedores',
  INVENTARIO: 'Inventario',
  DASHBOARD: 'Dashboard',
  CREDITOS: 'Creditos',
  ABONOS: 'Abonos',
  CUENTAS_COBRAR: 'Cuentas por Cobrar',
  CAJA: 'Caja',
  USUARIOS: 'Usuarios'
};

const USUARIOS_PERMITIDOS = [
  { usuario: 'JENIFER SANCHEZ', pass: '12345', rol: 'Administrador' },
  { usuario: 'URIEL ROQUES', pass: '12345', rol: 'Administrador' }
];

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('VARIEDADES CS - Inventario y Ventas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function configurarSistema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const definiciones = [
    { nombre: HOJAS.PRODUCTOS, encabezados: ['Código', 'Producto', 'Categoría', 'Existencia', 'Precio Compra', 'Precio Venta'] },
    { nombre: HOJAS.MOVIMIENTOS, encabezados: ['Fecha', 'Código', 'Producto', 'Categoría', 'Tipo', 'Cantidad', 'Precio Unitario', 'Total'] },
    { nombre: HOJAS.VENTAS, encabezados: ['N° Venta', 'Fecha', 'Código', 'Producto', 'Categoría', 'Cantidad', 'Precio Unitario', 'Total', 'Forma de Pago', 'Fecha Vencimiento', 'N° Crédito', 'Usuario', 'Estado', 'Fecha Anulación', 'Motivo'] },
    { nombre: HOJAS.COMPRAS, encabezados: ['N° Compra', 'Fecha', 'Código', 'Producto', 'Categoría', 'Cantidad', 'Precio Unitario', 'Total'] },
    { nombre: HOJAS.CLIENTES, encabezados: ['ID Cliente', 'Nombre', 'Teléfono', 'Dirección', 'Observaciones'] },
    { nombre: HOJAS.PROVEEDORES, encabezados: ['ID Proveedor', 'Nombre', 'Teléfono', 'Dirección', 'Observaciones'] },
    { nombre: HOJAS.CREDITOS, encabezados: ['N° Crédito', 'Fecha', 'ID Cliente', 'Cliente', 'N° Venta', 'Total Crédito', 'Abonado', 'Saldo', 'Vencimiento', 'Estado'] },
    { nombre: HOJAS.ABONOS, encabezados: ['N° Abono', 'Fecha', 'N° Crédito', 'ID Cliente', 'Cliente', 'Monto Abonado', 'Método de Pago', 'Observaciones'] },
    { nombre: HOJAS.CUENTAS_COBRAR, encabezados: ['ID Cliente', 'Cliente', 'Total Créditos', 'Total Abonado', 'Saldo Pendiente', 'Créditos Pendientes', 'Estado'] },
    { nombre: HOJAS.CAJA, encabezados: ['ID', 'Fecha', 'Tipo', 'Concepto', 'Monto', 'Usuario', 'Saldo'] },
    { nombre: HOJAS.INVENTARIO, encabezados: ['Código', 'Producto', 'Categoría', 'Existencia', 'Precio Compra', 'Precio Venta', 'Valor Total'] },
    { nombre: HOJAS.DASHBOARD, encabezados: ['Métrica', 'Valor', 'Última Actualización'] },
    { nombre: HOJAS.USUARIOS, encabezados: ['Usuario', 'Contraseña', 'Rol'] }
  ];

  definiciones.forEach(def => {
    let sheet = ss.getSheetByName(def.nombre);
    if (!sheet) sheet = ss.insertSheet(def.nombre);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(def.encabezados);
      const headerRange = sheet.getRange(1, 1, 1, def.encabezados.length);
      headerRange.setBackground('#1e293b');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  const sheetUsuarios = ss.getSheetByName(HOJAS.USUARIOS);
  if (sheetUsuarios.getLastRow() <= 1) {
    USUARIOS_PERMITIDOS.forEach(u => sheetUsuarios.appendRow([u.usuario, u.pass, u.rol]));
  }

  actualizarHojaInventario();
  return { success: true, mensaje: 'Sistema y hojas configuradas limpias y vacías correctamente.' };
}

function validarLogin(usuario, contrasena) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.USUARIOS);
    const uClean = String(usuario || '').trim().toUpperCase();
    const pClean = String(contrasena || '').trim();

    if (!uClean || !pClean) {
      return { success: false, mensaje: 'Por favor ingrese usuario y contraseña.' };
    }

    let usuariosValidos = [...USUARIOS_PERMITIDOS];
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
      usuariosValidos = data.map(r => ({
        usuario: String(r[0]).trim().toUpperCase(),
        pass: String(r[1]).trim(),
        rol: String(r[2]).trim()
      }));
    }

    const encontrado = usuariosValidos.find(u => u.usuario.toUpperCase() === uClean && u.pass === pClean);
    if (encontrado) {
      return { success: true, usuario: encontrado.usuario, rol: encontrado.rol || 'Administrador', mensaje: 'Bienvenido(a) a VARIEDADES CS' };
    } else {
      return { success: false, mensaje: 'Credenciales inválidas. Verifique usuario o contraseña.' };
    }
  } catch (err) {
    return { success: false, mensaje: 'Error al validar login: ' + err.toString() };
  }
}

function obtenerDatosIniciales() {
  return {
    productos: obtenerProductos(),
    dashboard: obtenerDashboard(),
    clientes: obtenerClientes(),
    proveedores: obtenerProveedores(),
    ventas: obtenerVentas(),
    creditos: obtenerCreditos(),
    cuentasPorCobrar: obtenerCuentasPorCobrar(),
    caja: obtenerCaja()
  };
}

function obtenerProductos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.PRODUCTOS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  return data.map((r, i) => ({
    fila: i + 2,
    codigo: String(r[0]).trim(),
    producto: String(r[1]).trim(),
    categoria: String(r[2]).trim(),
    existencia: Number(r[3]) || 0,
    precioCompra: Number(r[4]) || 0,
    precioVenta: Number(r[5]) || 0,
    agotado: (Number(r[3]) || 0) <= 0
  }));
}

function guardarProducto(producto) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.PRODUCTOS);
    const codigo = String(producto.codigo || '').trim().toUpperCase();
    const nombre = String(producto.producto || '').trim();
    const categoria = String(producto.categoria || 'General').trim();
    const existencia = Number(producto.existencia) || 0;
    const precioCompra = Number(producto.precioCompra) || 0;
    const precioVenta = Number(producto.precioVenta) || 0;

    if (!codigo || !nombre) return { success: false, mensaje: 'Código y Nombre son obligatorios.' };

    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues() : [];
    let filaExistente = -1;
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).trim().toUpperCase() === codigo) {
        filaExistente = i + 2;
        break;
      }
    }

    if (filaExistente > 0) {
      sheet.getRange(filaExistente, 1, 1, 6).setValues([[codigo, nombre, categoria, existencia, precioCompra, precioVenta]]);
    } else {
      sheet.appendRow([codigo, nombre, categoria, existencia, precioCompra, precioVenta]);
    }

    actualizarHojaInventario();
    return { success: true, mensaje: 'Producto guardado correctamente.' };
  } catch (e) {
    return { success: false, mensaje: 'Error al guardar producto: ' + e.toString() };
  }
}

function eliminarProducto(codigo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.PRODUCTOS);
    const codClean = String(codigo || '').trim().toUpperCase();
    const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : [];
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === codClean) {
        sheet.deleteRow(i + 2);
        actualizarHojaInventario();
        return { success: true, mensaje: 'Producto eliminado exitosamente.' };
      }
    }
    return { success: false, mensaje: 'Producto no encontrado.' };
  } catch (e) {
    return { success: false, mensaje: 'Error al eliminar: ' + e.toString() };
  }
}

function registrarVenta(datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetProd = ss.getSheetByName(HOJAS.PRODUCTOS);
    const sheetVentas = ss.getSheetByName(HOJAS.VENTAS);
    const sheetMov = ss.getSheetByName(HOJAS.MOVIMIENTOS);
    const sheetCaja = ss.getSheetByName(HOJAS.CAJA);
    const sheetCred = ss.getSheetByName(HOJAS.CREDITOS);

    const items = datos.items || [];
    if (!items.length) return { success: false, mensaje: 'El carrito está vacío.' };

    const prodData = sheetProd.getLastRow() > 1 ? sheetProd.getRange(2, 1, sheetProd.getLastRow() - 1, 6).getValues() : [];
    const prodMap = {};
    for (let i = 0; i < prodData.length; i++) {
      const code = String(prodData[i][0]).trim().toUpperCase();
      prodMap[code] = {
        fila: i + 2,
        nombre: prodData[i][1],
        categoria: prodData[i][2],
        existencia: Number(prodData[i][3]) || 0,
        precioCompra: Number(prodData[i][4]) || 0,
        precioVenta: Number(prodData[i][5]) || 0
      };
    }

    for (let item of items) {
      const cod = String(item.codigo).trim().toUpperCase();
      const cant = Number(item.cantidad) || 0;
      const prod = prodMap[cod];
      if (!prod) return { success: false, mensaje: 'El producto ' + cod + ' no existe.' };
      if (prod.existencia < cant) {
        return { success: false, mensaje: 'Solo quedan ' + prod.existencia + ' unidades disponibles de "' + prod.nombre + '".' };
      }
    }

    const numVenta = 'V-' + String(sheetVentas.getLastRow()).padStart(5, '0');
    const fechaHora = obtenerFechaHora();
    const formaPago = datos.formaPago || 'Efectivo';
    const usuario = datos.usuario || 'SISTEMA';
    const descuentoTotal = Number(datos.descuento) || 0;
    const subtotal = items.reduce((sum, it) => sum + (Number(it.cantidad) * Number(it.precioUnitario)), 0);
    const totalFinal = Math.max(0, subtotal - descuentoTotal);

    let numCredito = '';
    let fechaVenc = '';

    if (formaPago === 'Crédito') {
      if (!datos.idCliente) return { success: false, mensaje: 'Debe seleccionar un cliente para venta a crédito.' };
      numCredito = 'CR-' + String(sheetCred.getLastRow()).padStart(5, '0');
      fechaVenc = datos.fechaVencimiento || obtenerFechaVencimientoDefault(30);
      sheetCred.appendRow([numCredito, fechaHora, datos.idCliente, datos.nombreCliente || 'Cliente', numVenta, totalFinal, 0, totalFinal, fechaVenc, 'PENDIENTE']);
      recalcularCuentasPorCobrar();
    }

    items.forEach(item => {
      const cod = String(item.codigo).trim().toUpperCase();
      const cant = Number(item.cantidad) || 0;
      const pUnit = Number(item.precioUnitario) || 0;
      const prod = prodMap[cod];
      const totItem = cant * pUnit;

      sheetProd.getRange(prod.fila, 4).setValue(prod.existencia - cant);
      sheetVentas.appendRow([numVenta, fechaHora, cod, prod.nombre, prod.categoria, cant, pUnit, totItem, formaPago, fechaVenc, numCredito, usuario, 'COMPLETADA', '', '']);
      sheetMov.appendRow([fechaHora, cod, prod.nombre, prod.categoria, 'VENTA', cant, pUnit, totItem]);
    });

    if (formaPago !== 'Crédito') {
      const saldoActualCaja = obtenerSaldoCajaActual();
      const idCaja = 'CJ-' + String(sheetCaja.getLastRow()).padStart(5, '0');
      sheetCaja.appendRow([idCaja, fechaHora, 'Venta', 'Venta ' + numVenta + ' (' + formaPago + ')', totalFinal, usuario, saldoActualCaja + totalFinal]);
    }

    actualizarHojaInventario();
    return {
      success: true,
      mensaje: 'Venta ' + numVenta + ' registrada con éxito.',
      numeroVenta: numVenta,
      total: totalFinal,
      subtotal: subtotal,
      descuento: descuentoTotal,
      formaPago: formaPago,
      fecha: fechaHora,
      usuario: usuario,
      items: items
    };
  } catch (e) {
    return { success: false, mensaje: 'Error al registrar venta: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function anularVenta(numeroVenta, motivo, usuario) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetVentas = ss.getSheetByName(HOJAS.VENTAS);
    const sheetProd = ss.getSheetByName(HOJAS.PRODUCTOS);
    const sheetMov = ss.getSheetByName(HOJAS.MOVIMIENTOS);
    const sheetCaja = ss.getSheetByName(HOJAS.CAJA);
    const sheetCred = ss.getSheetByName(HOJAS.CREDITOS);

    const numClean = String(numeroVenta || '').trim().toUpperCase();
    if (!numClean) return { success: false, mensaje: 'Número de venta no especificado.' };
    if (!motivo) return { success: false, mensaje: 'Debe especificar el motivo de anulación.' };

    const ventasData = sheetVentas.getLastRow() > 1 ? sheetVentas.getRange(2, 1, sheetVentas.getLastRow() - 1, 15).getValues() : [];
    const filasVenta = [];
    for (let i = 0; i < ventasData.length; i++) {
      if (String(ventasData[i][0]).trim().toUpperCase() === numClean) {
        filasVenta.push({
          fila: i + 2,
          codigo: String(ventasData[i][2]).trim().toUpperCase(),
          producto: ventasData[i][3],
          categoria: ventasData[i][4],
          cantidad: Number(ventasData[i][5]) || 0,
          precioUnitario: Number(ventasData[i][6]) || 0,
          total: Number(ventasData[i][7]) || 0,
          formaPago: ventasData[i][8],
          numCredito: ventasData[i][10],
          estado: String(ventasData[i][12]).trim().toUpperCase()
        });
      }
    }

    if (!filasVenta.length) return { success: false, mensaje: 'No se encontró la venta ' + numClean + '.' };
    if (filasVenta[0].estado === 'ANULADA') return { success: false, mensaje: 'La venta ' + numClean + ' ya fue anulada previamente.' };

    const fechaHora = obtenerFechaHora();
    const userAnula = usuario || 'SISTEMA';

    const prodData = sheetProd.getLastRow() > 1 ? sheetProd.getRange(2, 1, sheetProd.getLastRow() - 1, 6).getValues() : [];
    const prodMap = {};
    for (let i = 0; i < prodData.length; i++) {
      prodMap[String(prodData[i][0]).trim().toUpperCase()] = { fila: i + 2, existencia: Number(prodData[i][3]) || 0 };
    }

    let totalVentaRevertir = 0;
    filasVenta.forEach(item => {
      totalVentaRevertir += item.total;
      if (prodMap[item.codigo]) {
        const filaP = prodMap[item.codigo].fila;
        const nuevaExistencia = prodMap[item.codigo].existencia + item.cantidad;
        sheetProd.getRange(filaP, 4).setValue(nuevaExistencia);
        prodMap[item.codigo].existencia = nuevaExistencia;
      }
      sheetVentas.getRange(item.fila, 13, 1, 3).setValues([['ANULADA', fechaHora, motivo]]);
      sheetMov.appendRow([fechaHora, item.codigo, item.producto, item.categoria, 'ANULACIÓN DE VENTA', item.cantidad, item.precioUnitario, item.total]);
    });

    if (filasVenta[0].formaPago !== 'Crédito') {
      const saldoActualCaja = obtenerSaldoCajaActual();
      const idCaja = 'CJ-' + String(sheetCaja.getLastRow()).padStart(5, '0');
      sheetCaja.appendRow([idCaja, fechaHora, 'Egreso', 'Reverso por Anulación de Venta ' + numClean, -totalVentaRevertir, userAnula, saldoActualCaja - totalVentaRevertir]);
    } else if (filasVenta[0].numCredito && sheetCred) {
      const credData = sheetCred.getLastRow() > 1 ? sheetCred.getRange(2, 1, sheetCred.getLastRow() - 1, 10).getValues() : [];
      for (let i = 0; i < credData.length; i++) {
        if (String(credData[i][0]).trim().toUpperCase() === String(filasVenta[0].numCredito).trim().toUpperCase()) {
          sheetCred.getRange(i + 2, 10).setValue('ANULADO');
          sheetCred.getRange(i + 2, 8).setValue(0);
          break;
        }
      }
      recalcularCuentasPorCobrar();
    }

    actualizarHojaInventario();
    return { success: true, mensaje: 'Venta ' + numClean + ' ANULADA con éxito. Stock y caja restituidos.' };
  } catch (e) {
    return { success: false, mensaje: 'Error al anular: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function obtenerVentas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.VENTAS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
  return data.map(r => ({
    numeroVenta: String(r[0]),
    fecha: r[1] instanceof Date ? formatearFecha(r[1]) : String(r[1]),
    codigo: String(r[2]),
    producto: String(r[3]),
    categoria: String(r[4]),
    cantidad: Number(r[5]) || 0,
    precioUnitario: Number(r[6]) || 0,
    total: Number(r[7]) || 0,
    formaPago: String(r[8]),
    fechaVencimiento: String(r[9] || ''),
    numCredito: String(r[10] || ''),
    usuario: String(r[11]),
    estado: String(r[12] || 'COMPLETADA'),
    fechaAnulacion: String(r[13] || ''),
    motivo: String(r[14] || '')
  }));
}

function registrarCompra(datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetCompras = ss.getSheetByName(HOJAS.COMPRAS);
    const sheetProd = ss.getSheetByName(HOJAS.PRODUCTOS);
    const sheetMov = ss.getSheetByName(HOJAS.MOVIMIENTOS);
    const sheetCaja = ss.getSheetByName(HOJAS.CAJA);

    const items = datos.items || [];
    if (!items.length) return { success: false, mensaje: 'Debe agregar productos a la compra.' };

    const numCompra = 'C-' + String(sheetCompras.getLastRow()).padStart(5, '0');
    const fechaHora = obtenerFechaHora();
    const usuario = datos.usuario || 'SISTEMA';
    let totalCompra = 0;

    const prodData = sheetProd.getLastRow() > 1 ? sheetProd.getRange(2, 1, sheetProd.getLastRow() - 1, 6).getValues() : [];
    const prodMap = {};
    for (let i = 0; i < prodData.length; i++) {
      prodMap[String(prodData[i][0]).trim().toUpperCase()] = { fila: i + 2, existencia: Number(prodData[i][3]) || 0 };
    }

    items.forEach(item => {
      const cod = String(item.codigo).trim().toUpperCase();
      const cant = Number(item.cantidad) || 0;
      const pCompra = Number(item.precioCompra) || 0;
      const tot = cant * pCompra;
      totalCompra += tot;

      if (prodMap[cod]) {
        const fila = prodMap[cod].fila;
        const nuevaExistencia = prodMap[cod].existencia + cant;
        sheetProd.getRange(fila, 4).setValue(nuevaExistencia);
        sheetProd.getRange(fila, 5).setValue(pCompra);
        if (item.precioVenta) sheetProd.getRange(fila, 6).setValue(Number(item.precioVenta));
      } else {
        sheetProd.appendRow([cod, item.producto, item.categoria || 'General', cant, pCompra, item.precioVenta || (pCompra * 1.35)]);
      }

      sheetCompras.appendRow([numCompra, fechaHora, cod, item.producto, item.categoria || 'General', cant, pCompra, tot]);
      sheetMov.appendRow([fechaHora, cod, item.producto, item.categoria || 'General', 'COMPRA', cant, pCompra, tot]);
    });

    if (datos.pagarDesdeCaja) {
      const saldoActualCaja = obtenerSaldoCajaActual();
      const idCaja = 'CJ-' + String(sheetCaja.getLastRow()).padStart(5, '0');
      sheetCaja.appendRow([idCaja, fechaHora, 'Egreso', 'Pago Compra Mercadería ' + numCompra, -totalCompra, usuario, saldoActualCaja - totalCompra]);
    }

    actualizarHojaInventario();
    return { success: true, mensaje: 'Compra ' + numCompra + ' registrada e inventario aumentado con éxito.', numeroCompra: numCompra };
  } catch (e) {
    return { success: false, mensaje: 'Error al registrar compra: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function obtenerClientes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CLIENTES);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  return data.map(r => ({
    id: String(r[0]).trim(),
    nombre: String(r[1]).trim(),
    telefono: String(r[2]).trim(),
    direccion: String(r[3]).trim(),
    observaciones: String(r[4] || '').trim()
  }));
}

function guardarCliente(cliente) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.CLIENTES);
    let id = String(cliente.id || '').trim();
    const nombre = String(cliente.nombre || '').trim();
    if (!nombre) return { success: false, mensaje: 'El nombre del cliente es obligatorio.' };

    const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues() : [];
    let fila = -1;
    if (id) {
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === id) { fila = i + 2; break; }
      }
    }

    if (fila > 0) {
      sheet.getRange(fila, 2, 1, 4).setValues([[nombre, cliente.telefono || '', cliente.direccion || '', cliente.observaciones || '']]);
    } else {
      id = 'CLI-' + String(sheet.getLastRow()).padStart(4, '0');
      sheet.appendRow([id, nombre, cliente.telefono || '', cliente.direccion || '', cliente.observaciones || '']);
    }
    return { success: true, mensaje: 'Cliente guardado correctamente.', id: id };
  } catch (e) {
    return { success: false, mensaje: 'Error: ' + e.toString() };
  }
}

function obtenerProveedores() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.PROVEEDORES);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
  return data.map(r => ({
    id: String(r[0]).trim(),
    nombre: String(r[1]).trim(),
    telefono: String(r[2]).trim(),
    direccion: String(r[3]).trim(),
    observaciones: String(r[4] || '').trim()
  }));
}

function guardarProveedor(proveedor) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.PROVEEDORES);
    let id = String(proveedor.id || '').trim();
    const nombre = String(proveedor.nombre || '').trim();
    if (!nombre) return { success: false, mensaje: 'El nombre del proveedor es obligatorio.' };

    const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues() : [];
    let fila = -1;
    if (id) {
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]).trim() === id) { fila = i + 2; break; }
      }
    }

    if (fila > 0) {
      sheet.getRange(fila, 2, 1, 4).setValues([[nombre, proveedor.telefono || '', proveedor.direccion || '', proveedor.observaciones || '']]);
    } else {
      id = 'PROV-' + String(sheet.getLastRow()).padStart(4, '0');
      sheet.appendRow([id, nombre, proveedor.telefono || '', proveedor.direccion || '', proveedor.observaciones || '']);
    }
    return { success: true, mensaje: 'Proveedor guardado correctamente.', id: id };
  } catch (e) {
    return { success: false, mensaje: 'Error: ' + e.toString() };
  }
}

function obtenerCreditos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CREDITOS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 10).getValues();
  const hoy = new Date();

  return data.map(r => {
    let estado = String(r[9] || 'PENDIENTE').trim().toUpperCase();
    const saldo = Number(r[7]) || 0;
    const vtoDate = r[8] instanceof Date ? r[8] : new Date(r[8]);
    if (estado !== 'ANULADO') {
      if (saldo <= 0.01) estado = 'PAGADO';
      else if (!isNaN(vtoDate.getTime()) && vtoDate < hoy) estado = 'VENCIDO';
      else estado = 'PENDIENTE';
    }
    return {
      numeroCredito: String(r[0]),
      fecha: r[1] instanceof Date ? formatearFecha(r[1]) : String(r[1]),
      idCliente: String(r[2]),
      cliente: String(r[3]),
      numeroVenta: String(r[4]),
      totalCredito: Number(r[5]) || 0,
      abonado: Number(r[6]) || 0,
      saldo: saldo,
      vencimiento: r[8] instanceof Date ? formatearFecha(r[8]) : String(r[8]),
      estado: estado
    };
  });
}

function registrarAbono(datos) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetCred = ss.getSheetByName(HOJAS.CREDITOS);
    const sheetAbonos = ss.getSheetByName(HOJAS.ABONOS);
    const sheetCaja = ss.getSheetByName(HOJAS.CAJA);

    const numCred = String(datos.numeroCredito || '').trim().toUpperCase();
    const monto = Number(datos.montoAbonado) || 0;
    const metodo = datos.metodoPago || 'Efectivo';
    const usuario = datos.usuario || 'SISTEMA';

    if (!numCred) return { success: false, mensaje: 'Seleccione un crédito.' };
    if (monto <= 0) return { success: false, mensaje: 'El monto debe ser mayor a 0.' };

    const credData = sheetCred.getLastRow() > 1 ? sheetCred.getRange(2, 1, sheetCred.getLastRow() - 1, 10).getValues() : [];
    let filaCred = -1;
    let creditoActual = null;

    for (let i = 0; i < credData.length; i++) {
      if (String(credData[i][0]).trim().toUpperCase() === numCred) {
        filaCred = i + 2;
        creditoActual = {
          idCliente: credData[i][2],
          cliente: credData[i][3],
          totalCredito: Number(credData[i][5]) || 0,
          abonado: Number(credData[i][6]) || 0,
          saldo: Number(credData[i][7]) || 0
        };
        break;
      }
    }

    if (!creditoActual) return { success: false, mensaje: 'Crédito no encontrado.' };
    if (monto > creditoActual.saldo + 0.001) {
      return { success: false, mensaje: 'No se puede abonar ' + monto.toFixed(2) + '. El saldo es ' + creditoActual.saldo.toFixed(2) + '.' };
    }

    const nuevoAbonado = creditoActual.abonado + monto;
    const nuevoSaldo = Math.max(0, creditoActual.saldo - monto);
    const nuevoEstado = nuevoSaldo <= 0.01 ? 'PAGADO' : 'PENDIENTE';
    const fechaHora = obtenerFechaHora();
    const numAbono = 'AB-' + String(sheetAbonos.getLastRow()).padStart(5, '0');

    sheetAbonos.appendRow([numAbono, fechaHora, numCred, creditoActual.idCliente, creditoActual.cliente, monto, metodo, datos.observaciones || 'Abono']);
    sheetCred.getRange(filaCred, 7, 1, 4).setValues([[nuevoAbonado, nuevoSaldo, credData[filaCred - 2][8], nuevoEstado]]);

    const saldoActualCaja = obtenerSaldoCajaActual();
    const idCaja = 'CJ-' + String(sheetCaja.getLastRow()).padStart(5, '0');
    sheetCaja.appendRow([idCaja, fechaHora, 'Abono', 'Abono ' + numAbono + ' a ' + numCred, monto, usuario, saldoActualCaja + monto]);

    recalcularCuentasPorCobrar();
    return { success: true, mensaje: 'Abono ' + numAbono + ' registrado por $' + monto.toFixed(2), nuevoSaldo: nuevoSaldo, nuevoEstado: nuevoEstado };
  } catch (e) {
    return { success: false, mensaje: 'Error al registrar abono: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

function recalcularCuentasPorCobrar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetCred = ss.getSheetByName(HOJAS.CREDITOS);
  const sheetCxc = ss.getSheetByName(HOJAS.CUENTAS_COBRAR);
  if (!sheetCred || !sheetCxc) return;

  const credData = sheetCred.getLastRow() > 1 ? sheetCred.getRange(2, 1, sheetCred.getLastRow() - 1, 10).getValues() : [];
  const clientesMap = {};

  credData.forEach(r => {
    if (String(r[9] || '').trim().toUpperCase() === 'ANULADO') return;
    const idCli = String(r[2]).trim();
    const nomCli = String(r[3]).trim();
    const totCred = Number(r[5]) || 0;
    const abonado = Number(r[6]) || 0;
    const saldo = Number(r[7]) || 0;

    if (!clientesMap[idCli]) {
      clientesMap[idCli] = { idCliente: idCli, cliente: nomCli, totalCreditos: 0, totalAbonado: 0, saldoPendiente: 0, creditosPendientes: 0 };
    }
    clientesMap[idCli].totalCreditos += totCred;
    clientesMap[idCli].totalAbonado += abonado;
    clientesMap[idCli].saldoPendiente += saldo;
    if (saldo > 0.01) clientesMap[idCli].creditosPendientes += 1;
  });

  if (sheetCxc.getLastRow() > 1) {
    sheetCxc.getRange(2, 1, sheetCxc.getLastRow() - 1, 7).clearContent();
  }

  const filas = Object.values(clientesMap).map(c => [
    c.idCliente, c.cliente, c.totalCreditos, c.totalAbonado, c.saldoPendiente, c.creditosPendientes, c.saldoPendiente > 0.01 ? 'PENDIENTE' : 'AL DÍA'
  ]);

  if (filas.length > 0) sheetCxc.getRange(2, 1, filas.length, 7).setValues(filas);
}

function obtenerCuentasPorCobrar() {
  recalcularCuentasPorCobrar();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CUENTAS_COBRAR);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  return data.map(r => ({
    idCliente: String(r[0]),
    cliente: String(r[1]),
    totalCreditos: Number(r[2]) || 0,
    totalAbonado: Number(r[3]) || 0,
    saldoPendiente: Number(r[4]) || 0,
    creditosPendientes: Number(r[5]) || 0,
    estado: String(r[6])
  }));
}

function obtenerCaja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CAJA);
  if (!sheet || sheet.getLastRow() <= 1) return { movimientos: [], saldoActual: 0, saldoInicial: 0, ingresos: 0, egresos: 0 };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  let saldoInicial = 0, ingresos = 0, egresos = 0;

  const movimientos = data.map(r => {
    const tipo = String(r[2] || '');
    const monto = Number(r[4]) || 0;
    const saldo = Number(r[6]) || 0;
    if (tipo.toLowerCase().includes('inicial')) saldoInicial += monto;
    else if (monto > 0) ingresos += monto;
    else egresos += Math.abs(monto);

    return {
      id: String(r[0]),
      fecha: r[1] instanceof Date ? formatearFecha(r[1]) : String(r[1]),
      tipo: tipo,
      concepto: String(r[3]),
      monto: monto,
      usuario: String(r[5]),
      saldo: saldo
    };
  });

  return {
    movimientos: movimientos.reverse(),
    saldoActual: movimientos.length > 0 ? movimientos[0].saldo : 0,
    saldoInicial: saldoInicial,
    ingresos: ingresos,
    egresos: egresos
  };
}

function registrarMovimientoCaja(datos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.CAJA);
    const tipo = datos.tipo || 'Ingreso';
    let monto = Number(datos.monto) || 0;
    if (monto <= 0) return { success: false, mensaje: 'El monto debe ser mayor a 0.' };
    if (tipo === 'Egreso') monto = -monto;

    const saldoActual = obtenerSaldoCajaActual();
    const nuevoSaldo = saldoActual + monto;
    const idCaja = 'CJ-' + String(sheet.getLastRow()).padStart(5, '0');
    const fechaHora = obtenerFechaHora();

    sheet.appendRow([idCaja, fechaHora, tipo, datos.concepto || tipo, monto, datos.usuario || 'SISTEMA', nuevoSaldo]);
    return { success: true, mensaje: 'Movimiento registrado.', nuevoSaldo: nuevoSaldo };
  } catch (e) {
    return { success: false, mensaje: 'Error: ' + e.toString() };
  }
}

function cerrarCaja(usuario, observaciones) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(HOJAS.CAJA);
    const saldoActual = obtenerSaldoCajaActual();
    const idCaja = 'CJ-' + String(sheet.getLastRow()).padStart(5, '0');
    const fechaHora = obtenerFechaHora();
    sheet.appendRow([idCaja, fechaHora, 'Cierre de Caja', 'Cierre de Turno. ' + (observaciones || ''), 0, usuario || 'SISTEMA', saldoActual]);
    return { success: true, mensaje: 'Cierre completado. Saldo: $' + saldoActual.toFixed(2), saldoFinal: saldoActual };
  } catch (e) {
    return { success: false, mensaje: 'Error: ' + e.toString() };
  }
}

function obtenerSaldoCajaActual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(HOJAS.CAJA);
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  return Number(sheet.getRange(sheet.getLastRow(), 7).getValue()) || 0;
}

function actualizarHojaInventario() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetProd = ss.getSheetByName(HOJAS.PRODUCTOS);
    const sheetInv = ss.getSheetByName(HOJAS.INVENTARIO);
    if (!sheetProd || !sheetInv) return;

    if (sheetInv.getLastRow() > 1) sheetInv.getRange(2, 1, sheetInv.getLastRow() - 1, 7).clearContent();
    if (sheetProd.getLastRow() <= 1) return;

    const prods = sheetProd.getRange(2, 1, sheetProd.getLastRow() - 1, 6).getValues();
    const rows = prods.map(p => [
      p[0], p[1], p[2], Number(p[3]) || 0, Number(p[4]) || 0, Number(p[5]) || 0, (Number(p[3]) || 0) * (Number(p[4]) || 0)
    ]);
    if (rows.length > 0) sheetInv.getRange(2, 1, rows.length, 7).setValues(rows);
  } catch (e) {
    console.error(e);
  }
}

function obtenerDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const prods = obtenerProductos();
  const ventas = obtenerVentas();
  const creditos = obtenerCreditos();
  const saldoCaja = obtenerSaldoCajaActual();
  const hoyStr = formatearFechaCorta(new Date());

  let ventasDelDia = 0, gananciaTotal = 0;
  const prodCostMap = {};
  prods.forEach(p => { prodCostMap[p.codigo] = p.precioCompra; });

  ventas.forEach(v => {
    if (v.estado !== 'ANULADA') {
      if (String(v.fecha).includes(hoyStr)) ventasDelDia += v.total;
      const costo = prodCostMap[v.codigo] || 0;
      gananciaTotal += (v.total - (costo * v.cantidad));
    }
  });

  return {
    ventasDelDia: ventasDelDia,
    cantidadProductos: prods.length,
    existenciaTotal: prods.reduce((acc, p) => acc + p.existencia, 0),
    valorInventario: prods.reduce((acc, p) => acc + (p.existencia * p.precioCompra), 0),
    ganancia: gananciaTotal,
    creditosPendientes: creditos.filter(c => c.estado === 'PENDIENTE' || c.estado === 'VENCIDO').reduce((acc, c) => acc + c.saldo, 0),
    dineroEnCaja: saldoCaja,
    ventasRecientes: [...ventas].reverse().slice(0, 10)
  };
}

function obtenerFechaHora() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'GMT-6', 'yyyy-MM-dd HH:mm:ss');
}

function formatearFecha(d) {
  if (!(d instanceof Date)) return String(d);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT-6', 'yyyy-MM-dd HH:mm:ss');
}

function formatearFechaCorta(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT-6', 'yyyy-MM-dd');
}

function obtenerFechaVencimientoDefault(dias) {
  const d = new Date();
  d.setDate(d.getDate() + (dias || 30));
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'GMT-6', 'yyyy-MM-dd');
}
`;
