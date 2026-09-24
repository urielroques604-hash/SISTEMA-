import * as XLSX from 'xlsx';
import { 
  Producto, 
  VentaRegistro, 
  Cliente, 
  Proveedor, 
  Credito, 
  Abono, 
  CuentaPorCobrar, 
  MovimientoCaja,
  CompraRegistro 
} from '../types';
import { obtenerTasaCambio } from './currency';

export function exportarTodoAExcel(datos: {
  productos: Producto[];
  ventas: VentaRegistro[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  creditos: Credito[];
  abonos?: Abono[];
  compras?: CompraRegistro[];
  caja: MovimientoCaja[];
  cuentasPorCobrar?: CuentaPorCobrar[];
}) {
  const wb = XLSX.utils.book_new();
  const tcGlobal = obtenerTasaCambio();

  // -------------------------------------------------------------
  // HOJA 0: RESUMEN GENERAL / DASHBOARD EJECUTIVO
  // -------------------------------------------------------------
  const totalVentasMonto = datos.ventas.filter(v => v.estado !== 'ANULADA').reduce((acc, v) => acc + v.total, 0);
  const totalVentasCompletadas = datos.ventas.filter(v => v.estado !== 'ANULADA').length;
  const totalVentasAnuladas = datos.ventas.filter(v => v.estado === 'ANULADA').length;
  const valorInventarioCosto = datos.productos.reduce((acc, p) => acc + (p.existencia * p.precioCompra), 0);
  const valorInventarioVenta = datos.productos.reduce((acc, p) => acc + (p.existencia * p.precioVenta), 0);
  const totalPorCobrar = datos.creditos.filter(c => c.estado !== 'ANULADO').reduce((acc, c) => acc + c.saldo, 0);
  const totalAbonado = datos.creditos.filter(c => c.estado !== 'ANULADO').reduce((acc, c) => acc + c.abonado, 0);
  const saldoCaja = datos.caja.length > 0 ? datos.caja[datos.caja.length - 1].saldo : 0;
  const fechaGeneracion = new Date().toLocaleString();

  const dataResumen = [
    { 'MÉTRICA / INDICADOR': 'SISTEMA DE GESTIÓN', 'VALOR': 'VARIEDADES CS - BOUTIQUE & POS', 'DETALLE / NOTAS': 'Exportación Integral Multi-Moneda' },
    { 'MÉTRICA / INDICADOR': 'Fecha y Hora de Generación', 'VALOR': fechaGeneracion, 'DETALLE / NOTAS': 'Datos consolidados en tiempo real' },
    { 'MÉTRICA / INDICADOR': 'Tasa Oficial de Cambio Activa', 'VALOR': `1 $ USD = C$ ${tcGlobal.toFixed(2)} NIO`, 'DETALLE / NOTAS': 'Conversión estándar para Córdobas' },
    { 'MÉTRICA / INDICADOR': '', 'VALOR': '', 'DETALLE / NOTAS': '' },
    { 'MÉTRICA / INDICADOR': '💰 Total Ventas Netas', 'VALOR': `$${totalVentasMonto.toFixed(2)} / C$ ${(totalVentasMonto * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': `${totalVentasCompletadas} ventas completadas` },
    { 'MÉTRICA / INDICADOR': '⚠️ Ventas Anuladas', 'VALOR': totalVentasAnuladas, 'DETALLE / NOTAS': 'Registros anulados debidamente auditados' },
    { 'MÉTRICA / INDICADOR': '💵 Saldo Actual en Caja', 'VALOR': `$${saldoCaja.toFixed(2)} / C$ ${(saldoCaja * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': 'Caja Chica y Arqueo' },
    { 'MÉTRICA / INDICADOR': '📦 Total Productos en Catálogo', 'VALOR': datos.productos.length, 'DETALLE / NOTAS': 'Artículos registrados' },
    { 'MÉTRICA / INDICADOR': '🏷️ Inversión Total en Inventario (Costo)', 'VALOR': `$${valorInventarioCosto.toFixed(2)} / C$ ${(valorInventarioCosto * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': 'Costo adquisición' },
    { 'MÉTRICA / INDICADOR': '💎 Valor Proyectado de Venta', 'VALOR': `$${valorInventarioVenta.toFixed(2)} / C$ ${(valorInventarioVenta * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': `Ganancia proyectada: $${(valorInventarioVenta - valorInventarioCosto).toFixed(2)}` },
    { 'MÉTRICA / INDICADOR': '👥 Clientes Registrados', 'VALOR': datos.clientes.length, 'DETALLE / NOTAS': 'Base de contactos' },
    { 'MÉTRICA / INDICADOR': '💳 Cartera de Créditos Otorgada', 'VALOR': `$${(totalPorCobrar + totalAbonado).toFixed(2)} / C$ ${((totalPorCobrar + totalAbonado) * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': `${datos.creditos.length} créditos generados` },
    { 'MÉTRICA / INDICADOR': '🔴 Saldo Total por Cobrar (Deuda)', 'VALOR': `$${totalPorCobrar.toFixed(2)} / C$ ${(totalPorCobrar * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': 'Cuentas pendientes de cobro' },
    { 'MÉTRICA / INDICADOR': '🟢 Total Abonos Recibidos', 'VALOR': `$${totalAbonado.toFixed(2)} / C$ ${(totalAbonado * tcGlobal).toFixed(2)}`, 'DETALLE / NOTAS': `${(datos.abonos || []).length} abonos efectuados` },
    { 'MÉTRICA / INDICADOR': '🚚 Proveedores Registrados', 'VALOR': datos.proveedores.length, 'DETALLE / NOTAS': 'Cadena de suministro' },
  ];
  const wsResumen = XLSX.utils.json_to_sheet(dataResumen);
  wsResumen['!cols'] = [{ wch: 35 }, { wch: 36 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

  // -------------------------------------------------------------
  // HOJA 1: INVENTARIO Y CATÁLOGO DE PRODUCTOS (DOBLE MONEDA)
  // -------------------------------------------------------------
  const dataInventario = datos.productos.map(p => {
    let estadoIndicador = '🟢 EN STOCK';
    if (p.existencia <= 0) estadoIndicador = '🔴 AGOTADO';
    else if (p.existencia <= 3) estadoIndicador = '🟡 STOCK BAJO';

    const pCompraUSD = p.precioCompra;
    const pCompraNIO = p.precioCompraCordobas || (pCompraUSD * tcGlobal);
    const pVentaUSD = p.precioVenta;
    const pVentaNIO = p.precioVentaCordobas || (pVentaUSD * tcGlobal);

    const gananciaUSD = pVentaUSD - pCompraUSD;
    const gananciaNIO = pVentaNIO - pCompraNIO;
    const margenPct = pCompraUSD > 0 ? ((gananciaUSD / pCompraUSD) * 100).toFixed(1) + '%' : '100%';

    return {
      'Código': p.codigo,
      'Producto / Descripción': p.producto,
      'Contenido (ml)': p.mililitros ? `${p.mililitros} ml` : '',
      'Marca': p.marca || '',
      'Categoría': p.categoria,
      'Existencia (Stock)': p.existencia,
      'Precio Compra ($ USD)': Number(pCompraUSD.toFixed(2)),
      'Precio Compra (C$ NIO)': Number(pCompraNIO.toFixed(2)),
      'Precio Venta ($ USD)': Number(pVentaUSD.toFixed(2)),
      'Precio Venta (C$ NIO)': Number(pVentaNIO.toFixed(2)),
      'Ganancia Unitaria ($ USD)': Number(gananciaUSD.toFixed(2)),
      'Ganancia Unitaria (C$ NIO)': Number(gananciaNIO.toFixed(2)),
      'Margen (%)': margenPct,
      'Valor Inversión Costo ($)': Number((p.existencia * pCompraUSD).toFixed(2)),
      'Valor Inversión Costo (C$)': Number((p.existencia * pCompraNIO).toFixed(2)),
      'Valor Proyectado Venta ($)': Number((p.existencia * pVentaUSD).toFixed(2)),
      'Valor Proyectado Venta (C$)': Number((p.existencia * pVentaNIO).toFixed(2)),
      'Estado Stock': estadoIndicador
    };
  });
  const wsInventario = XLSX.utils.json_to_sheet(dataInventario);
  wsInventario['!cols'] = [
    { wch: 12 }, { wch: 32 }, { wch: 16 }, { wch: 16 }, 
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 14 }, 
    { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario');

  // -------------------------------------------------------------
  // HOJA 2: REGISTRO DE VENTAS (DOBLE MONEDA)
  // -------------------------------------------------------------
  const dataVentas = datos.ventas.map(v => {
    const estadoIndicador = v.estado === 'COMPLETADA' ? '✅ COMPLETADA' : '❌ ANULADA';
    const tc = v.tasaCambio || tcGlobal;
    const unitNIO = v.precioUnitarioCordobas || (v.precioUnitario * tc);
    const totNIO = v.totalCordobas || (v.total * tc);

    return {
      'N° Venta': v.numeroVenta,
      'Fecha y Hora': v.fecha,
      'Cliente': v.cliente || 'Consumidor Final',
      'Código': v.codigo,
      'Producto': v.producto,
      'Contenido (ml)': v.mililitros ? `${v.mililitros} ml` : '',
      'Marca': v.marca || '',
      'Categoría': v.categoria,
      'Cantidad': v.cantidad,
      'Precio Unitario ($ USD)': Number(v.precioUnitario.toFixed(2)),
      'Precio Unitario (C$ NIO)': Number(unitNIO.toFixed(2)),
      'Total Venta ($ USD)': Number(v.total.toFixed(2)),
      'Total Venta (C$ NIO)': Number(totNIO.toFixed(2)),
      'Forma de Pago': v.formaPago,
      'Moneda Pago': v.monedaPago || 'USD',
      'Efectivo Recibido ($)': v.efectivoRecibido !== undefined ? Number(v.efectivoRecibido.toFixed(2)) : '',
      'Efectivo Recibido (C$)': v.efectivoRecibidoCordobas !== undefined ? Number(v.efectivoRecibidoCordobas.toFixed(2)) : '',
      'Cambio ($)': v.cambio !== undefined ? Number(v.cambio.toFixed(2)) : '',
      'Cambio (C$)': v.cambioCordobas !== undefined ? Number(v.cambioCordobas.toFixed(2)) : '',
      'Tasa Cambio Usada': tc,
      'Cajero / Usuario': v.usuario,
      'Estado': estadoIndicador,
      'N° Crédito Relacionado': v.numCredito || '',
      'Fecha Anulación': v.fechaAnulacion || '',
      'Motivo Anulación': v.motivo || ''
    };
  });
  const wsVentas = XLSX.utils.json_to_sheet(dataVentas);
  wsVentas['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 30 }, 
    { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
    { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, 
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 18 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

  // -------------------------------------------------------------
  // HOJA 3: CRÉDITOS OTORGADOS (DOBLE MONEDA)
  // -------------------------------------------------------------
  const dataCreditos = datos.creditos.map(c => {
    let estadoIndicador = '🟡 PENDIENTE';
    if (c.estado === 'PAGADO' || c.saldo <= 0.01) estadoIndicador = '✅ PAGADO';
    else if (c.estado === 'ANULADO') estadoIndicador = '⚪ ANULADO';
    else if (c.estado === 'VENCIDO') estadoIndicador = '🔴 VENCIDO';

    const tc = c.tasaCambio || tcGlobal;
    const totNIO = c.totalCreditoCordobas || (c.totalCredito * tc);
    const abonNIO = c.abonadoCordobas || (c.abonado * tc);
    const saldNIO = c.saldoCordobas || (c.saldo * tc);

    return {
      'N° Crédito': c.numeroCredito,
      'Fecha Emisión': c.fecha,
      'ID Cliente': c.idCliente,
      'Nombre Cliente': c.cliente,
      'N° Venta Asociada': c.numeroVenta,
      'Total Crédito ($ USD)': Number(c.totalCredito.toFixed(2)),
      'Total Crédito (C$ NIO)': Number(totNIO.toFixed(2)),
      'Total Abonado ($ USD)': Number(c.abonado.toFixed(2)),
      'Total Abonado (C$ NIO)': Number(abonNIO.toFixed(2)),
      'Saldo Pendiente ($ USD)': Number(c.saldo.toFixed(2)),
      'Saldo Pendiente (C$ NIO)': Number(saldNIO.toFixed(2)),
      'Tasa Cambio': tc,
      'Fecha Vencimiento': c.vencimiento,
      'Estado': estadoIndicador
    };
  });
  const wsCreditos = XLSX.utils.json_to_sheet(dataCreditos);
  wsCreditos['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 26 }, 
    { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
    { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCreditos, 'Créditos');

  // -------------------------------------------------------------
  // HOJA 4: HISTORIAL DE ABONOS A CRÉDITOS
  // -------------------------------------------------------------
  const abonosLista = datos.abonos || [];
  const dataAbonos = abonosLista.map(ab => {
    const tc = ab.tasaCambio || tcGlobal;
    const abNIO = ab.montoAbonadoCordobas || (ab.montoAbonado * tc);

    return {
      'N° Abono': ab.numeroAbono,
      'Fecha y Hora': ab.fecha,
      'N° Crédito': ab.numeroCredito,
      'ID Cliente': ab.idCliente,
      'Cliente': ab.cliente,
      'Monto Abonado ($ USD)': Number(ab.montoAbonado.toFixed(2)),
      'Monto Abonado (C$ NIO)': Number(abNIO.toFixed(2)),
      'Tasa Cambio': tc,
      'Método de Pago': ab.metodoPago,
      'Observaciones': ab.observaciones,
      'Estado Abono': '🟢 REGISTRADO Y APLICADO'
    };
  });
  const wsAbonos = XLSX.utils.json_to_sheet(dataAbonos);
  wsAbonos['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, 
    { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 30 }, 
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAbonos, 'Abonos');

  // -------------------------------------------------------------
  // HOJA 5: CUENTAS POR COBRAR (CxC) CONSOLIDADO
  // -------------------------------------------------------------
  const cxcMap: Record<string, CuentaPorCobrar> = {};
  datos.creditos.forEach(c => {
    if (c.estado === 'ANULADO') return;
    if (!cxcMap[c.idCliente]) {
      cxcMap[c.idCliente] = {
        idCliente: c.idCliente,
        cliente: c.cliente,
        totalCreditos: 0,
        totalAbonado: 0,
        saldoPendiente: 0,
        creditosPendientes: 0,
        estado: 'AL DÍA'
      };
    }
    cxcMap[c.idCliente].totalCreditos += c.totalCredito;
    cxcMap[c.idCliente].totalAbonado += c.abonado;
    cxcMap[c.idCliente].saldoPendiente += c.saldo;
    if (c.saldo > 0.01) {
      cxcMap[c.idCliente].creditosPendientes += 1;
    }
  });

  const dataCxC = Object.values(cxcMap).map(c => {
    const estadoIndicador = c.saldoPendiente <= 0.01 ? '✅ AL DÍA' : '🔴 PENDIENTE DE COBRO';
    return {
      'ID Cliente': c.idCliente,
      'Nombre Cliente': c.cliente,
      'Total Créditos Otorgados ($)': Number(c.totalCreditos.toFixed(2)),
      'Total Créditos Otorgados (C$)': Number((c.totalCreditos * tcGlobal).toFixed(2)),
      'Total Abonado Acumulado ($)': Number(c.totalAbonado.toFixed(2)),
      'Total Abonado Acumulado (C$)': Number((c.totalAbonado * tcGlobal).toFixed(2)),
      'Saldo Pendiente por Cobrar ($)': Number(c.saldoPendiente.toFixed(2)),
      'Saldo Pendiente por Cobrar (C$)': Number((c.saldoPendiente * tcGlobal).toFixed(2)),
      'Cantidad Créditos Pendientes': c.creditosPendientes,
      'Estado de Cuenta': estadoIndicador
    };
  });
  const wsCxC = XLSX.utils.json_to_sheet(dataCxC);
  wsCxC['!cols'] = [
    { wch: 14 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, 
    { wch: 22 }, { wch: 22 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCxC, 'CuentasPorCobrar');

  // -------------------------------------------------------------
  // HOJA 6: CLIENTES
  // -------------------------------------------------------------
  const dataClientes = datos.clientes.map(c => ({
    'ID Cliente': c.id,
    'Nombre Completo': c.nombre,
    'Teléfono': c.telefono,
    'Dirección': c.direccion,
    'Observaciones': c.observaciones,
    'Estado': '🟢 ACTIVO'
  }));
  const wsClientes = XLSX.utils.json_to_sheet(dataClientes);
  wsClientes['!cols'] = [
    { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 30 }, 
    { wch: 30 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

  // -------------------------------------------------------------
  // HOJA 7: PROVEEDORES
  // -------------------------------------------------------------
  const dataProveedores = datos.proveedores.map(p => ({
    'ID Proveedor': p.id,
    'Nombre o Empresa': p.nombre,
    'Teléfono Contacto': p.telefono,
    'Dirección Comercial': p.direccion,
    'Observaciones / Rubro': p.observaciones,
    'Estado': '🟢 ACTIVO'
  }));
  const wsProveedores = XLSX.utils.json_to_sheet(dataProveedores);
  wsProveedores['!cols'] = [
    { wch: 14 }, { wch: 32 }, { wch: 18 }, { wch: 30 }, 
    { wch: 30 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsProveedores, 'Proveedores');

  // -------------------------------------------------------------
  // HOJA 8: COMPRAS DE MERCADERÍA (DOBLE MONEDA)
  // -------------------------------------------------------------
  if (datos.compras && datos.compras.length > 0) {
    const dataCompras = datos.compras.map(c => {
      const tc = c.tasaCambio || tcGlobal;
      const unitUSD = (c.precioCompra ?? c.precioUnitario) || 0;
      const unitNIO = c.precioCompraCordobas || (unitUSD * tc);
      const totUSD = c.total;
      const totNIO = c.totalCordobas || (totUSD * tc);

      return {
        'N° Compra': c.numeroCompra,
        'Fecha': c.fecha,
        'Código': c.codigo,
        'Producto': c.producto,
        'Categoría': c.categoria,
        'Cantidad': c.cantidad,
        'Precio Compra ($ USD)': Number(unitUSD.toFixed(2)),
        'Precio Compra (C$ NIO)': Number(unitNIO.toFixed(2)),
        'Total Invertido ($ USD)': Number(totUSD.toFixed(2)),
        'Total Invertido (C$ NIO)': Number(totNIO.toFixed(2)),
        'Tasa Cambio': tc,
        'Proveedor': c.proveedor || 'Sin especificar',
        'Pagado con Caja': c.pagadoDesdeCaja ? 'SÍ (Caja Chica)' : 'NO (Fondos Externos)'
      };
    });
    const wsCompras = XLSX.utils.json_to_sheet(dataCompras);
    wsCompras['!cols'] = [
      { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 28 }, 
      { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
      { wch: 14 }, { wch: 26 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras');
  }

  // -------------------------------------------------------------
  // HOJA 9: CAJA CHICA Y ARQUEO (DOBLE MONEDA)
  // -------------------------------------------------------------
  const dataCaja = datos.caja.map(m => {
    const tipoIndicador = m.tipo === 'Ingreso' || m.tipo === 'Venta' ? '🟢 INGRESO' : '🔴 EGRESO';
    const tc = m.tasaCambio || tcGlobal;
    const mNIO = m.montoCordobas !== undefined ? m.montoCordobas : (m.monto * tc);
    const sNIO = m.saldoCordobas !== undefined ? m.saldoCordobas : (m.saldo * tc);

    return {
      'ID Movimiento': m.id,
      'Fecha y Hora': m.fecha,
      'Tipo Movimiento': tipoIndicador,
      'Concepto': m.concepto,
      'Monto Transacción ($ USD)': Number(m.monto.toFixed(2)),
      'Monto Transacción (C$ NIO)': Number(mNIO.toFixed(2)),
      'Usuario Responsable': m.usuario,
      'Saldo Resultante ($ USD)': Number(m.saldo.toFixed(2)),
      'Saldo Resultante (C$ NIO)': Number(sNIO.toFixed(2))
    };
  });
  const wsCaja = XLSX.utils.json_to_sheet(dataCaja);
  wsCaja['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 38 }, 
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsCaja, 'CajaChica');

  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `VARIEDADES_CS_BaseDatos_Completa_${fechaHoy}.xlsx`);
}

export function exportarVentasExcel(ventas: VentaRegistro[]) {
  const wb = XLSX.utils.book_new();
  const tcGlobal = obtenerTasaCambio();

  const data = ventas.map(v => {
    const tc = v.tasaCambio || tcGlobal;
    const unitNIO = v.precioUnitarioCordobas || (v.precioUnitario * tc);
    const totNIO = v.totalCordobas || (v.total * tc);

    return {
      'N° Venta': v.numeroVenta,
      'Fecha y Hora': v.fecha,
      'Cliente': v.cliente || 'Consumidor Final',
      'Código': v.codigo,
      'Producto': v.producto,
      'Contenido (ml)': v.mililitros ? `${v.mililitros} ml` : '',
      'Marca': v.marca || '',
      'Categoría': v.categoria,
      'Cantidad': v.cantidad,
      'Precio Unitario ($ USD)': Number(v.precioUnitario.toFixed(2)),
      'Precio Unitario (C$ NIO)': Number(unitNIO.toFixed(2)),
      'Total ($ USD)': Number(v.total.toFixed(2)),
      'Total (C$ NIO)': Number(totNIO.toFixed(2)),
      'Forma de Pago': v.formaPago,
      'Moneda Pago': v.monedaPago || 'USD',
      'Efectivo Recibido ($)': v.efectivoRecibido !== undefined ? Number(v.efectivoRecibido.toFixed(2)) : '',
      'Efectivo Recibido (C$)': v.efectivoRecibidoCordobas !== undefined ? Number(v.efectivoRecibidoCordobas.toFixed(2)) : '',
      'Cambio ($)': v.cambio !== undefined ? Number(v.cambio.toFixed(2)) : '',
      'Cambio (C$)': v.cambioCordobas !== undefined ? Number(v.cambioCordobas.toFixed(2)) : '',
      'Tasa Cambio': tc,
      'Cajero': v.usuario,
      'Estado': v.estado === 'COMPLETADA' ? '✅ COMPLETADA' : '❌ ANULADA',
      'Motivo Anulación': v.motivo || ''
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 30 }, 
    { wch: 16 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
    { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 28 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `VARIEDADES_CS_Ventas_${fechaHoy}.xlsx`);
}

export function exportarInventarioExcel(productos: Producto[]) {
  const wb = XLSX.utils.book_new();
  const tcGlobal = obtenerTasaCambio();

  const data = productos.map(p => {
    let estadoIndicador = '🟢 EN STOCK';
    if (p.existencia <= 0) estadoIndicador = '🔴 AGOTADO';
    else if (p.existencia <= 3) estadoIndicador = '🟡 STOCK BAJO';

    const pCompraUSD = p.precioCompra;
    const pCompraNIO = p.precioCompraCordobas || (pCompraUSD * tcGlobal);
    const pVentaUSD = p.precioVenta;
    const pVentaNIO = p.precioVentaCordobas || (pVentaUSD * tcGlobal);

    return {
      'Código': p.codigo,
      'Producto': p.producto,
      'Contenido (ml)': p.mililitros ? `${p.mililitros} ml` : '',
      'Marca': p.marca || '',
      'Categoría': p.categoria,
      'Existencia': p.existencia,
      'Precio Compra ($ USD)': Number(pCompraUSD.toFixed(2)),
      'Precio Compra (C$ NIO)': Number(pCompraNIO.toFixed(2)),
      'Precio Venta ($ USD)': Number(pVentaUSD.toFixed(2)),
      'Precio Venta (C$ NIO)': Number(pVentaNIO.toFixed(2)),
      'Ganancia Unitaria ($ USD)': Number((pVentaUSD - pCompraUSD).toFixed(2)),
      'Ganancia Unitaria (C$ NIO)': Number((pVentaNIO - pCompraNIO).toFixed(2)),
      'Valor Inversión ($ USD)': Number((p.existencia * pCompraUSD).toFixed(2)),
      'Valor Inversión (C$ NIO)': Number((p.existencia * pCompraNIO).toFixed(2)),
      'Valor Proyectado Venta ($ USD)': Number((p.existencia * pVentaUSD).toFixed(2)),
      'Valor Proyectado Venta (C$ NIO)': Number((p.existencia * pVentaNIO).toFixed(2)),
      'Tasa Cambio Usada': tcGlobal,
      'Disponibilidad': estadoIndicador
    };
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 16 }, { wch: 14 }, 
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, 
    { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 22 }, { wch: 22 }, { wch: 16 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `VARIEDADES_CS_Inventario_${fechaHoy}.xlsx`);
}
