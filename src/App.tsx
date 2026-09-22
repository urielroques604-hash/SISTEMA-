import React, { useState, useEffect } from 'react';
import { 
  PRODUCTOS_INICIALES, 
  CLIENTES_INICIALES, 
  PROVEEDORES_INICIALES, 
  VENTAS_INICIALES, 
  CREDITOS_INICIALES, 
  CAJA_INICIAL 
} from './data/initialData';
import { 
  Producto, 
  Cliente, 
  Proveedor, 
  VentaRegistro, 
  Credito, 
  Abono, 
  CuentaPorCobrar, 
  MovimientoCaja, 
  ItemCarrito,
  CompraRegistro 
} from './types';

// Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductosView } from './components/ProductosView';
import { VentasView } from './components/VentasView';
import { AnularVentaView } from './components/AnularVentaView';
import { FacturaModal } from './components/FacturaModal';
import { ComprasView } from './components/ComprasView';
import { ClientesView } from './components/ClientesView';
import { ProveedoresView } from './components/ProveedoresView';
import { CreditosView } from './components/CreditosView';
import { CxcView } from './components/CxcView';
import { CajaView } from './components/CajaView';
import { InventarioView } from './components/InventarioView';
import { LoginModal } from './components/LoginModal';
import { ImportarExcelModal } from './components/ImportarExcelModal';
import { VaciarBaseDatosModal, ModoLimpieza } from './components/VaciarBaseDatosModal';
import { CambiarPasswordModal } from './components/CambiarPasswordModal';
import { ResetPasswordHandlerModal } from './components/ResetPasswordHandlerModal';
import { GmailView } from './components/GmailView';
import { googleSignOut } from './services/gmailAuth';
import { exportarTodoAExcel, exportarVentasExcel, exportarInventarioExcel } from './utils/exportExcel';
import { firestoreSync } from './services/firebase';
import { CheckCircle2, Info, LayoutDashboard, ShoppingBag, Package, Receipt, Menu } from 'lucide-react';

export default function App() {
  // Authentication state - Requiere autenticación con Google o credenciales
  const [usuario, setUsuario] = useState<string | null>(() => {
    return localStorage.getItem('variedades_cs_user') || null;
  });
  const [rol, setRol] = useState<string>(() => {
    return localStorage.getItem('variedades_cs_role') || 'Administrador';
  });

  // Navigation
  const [vistaActual, setVistaActual] = useState<string>('dashboard');
  const [menuAbiertoMovil, setMenuAbiertoMovil] = useState<boolean>(false);

  // Modo sin imágenes (quitar o mostrar imágenes en todo el sistema)
  const [modoSinImagenes, setModoSinImagenes] = useState<boolean>(() => {
    return localStorage.getItem('cs_sin_imagenes') === 'true';
  });
  const [modalCambiarPasswordAbierto, setModalCambiarPasswordAbierto] = useState<boolean>(false);

  const toggleModoSinImagenes = () => {
    setModoSinImagenes(prev => {
      const nuevo = !prev;
      localStorage.setItem('cs_sin_imagenes', String(nuevo));
      mostrarToast(
        nuevo 
          ? 'Modo sin fotos activado: el sistema funcionará sin cargar imágenes.' 
          : 'Modo con fotos activado: se mostrarán las imágenes.',
        'info'
      );
      return nuevo;
    });
  };

  // Business entities persisted in localStorage (Limpias y vacías por defecto)
  const inicializarVacio = () => {
    const yaReseteado = localStorage.getItem('cs_reset_empty_v1');
    if (!yaReseteado) {
      localStorage.removeItem('cs_productos');
      localStorage.removeItem('cs_clientes');
      localStorage.removeItem('cs_proveedores');
      localStorage.removeItem('cs_ventas');
      localStorage.removeItem('cs_creditos');
      localStorage.removeItem('cs_abonos');
      localStorage.removeItem('cs_caja');
      localStorage.setItem('cs_reset_empty_v1', 'true');
    }
  };
  inicializarVacio();

  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('cs_productos');
    return saved ? JSON.parse(saved) : [];
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('cs_clientes');
    return saved ? JSON.parse(saved) : [];
  });

  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    const saved = localStorage.getItem('cs_proveedores');
    return saved ? JSON.parse(saved) : [];
  });

  const [ventas, setVentas] = useState<VentaRegistro[]>(() => {
    const saved = localStorage.getItem('cs_ventas');
    return saved ? JSON.parse(saved) : [];
  });

  const [creditos, setCreditos] = useState<Credito[]>(() => {
    const saved = localStorage.getItem('cs_creditos');
    return saved ? JSON.parse(saved) : [];
  });

  const [abonos, setAbonos] = useState<Abono[]>(() => {
    const saved = localStorage.getItem('cs_abonos');
    return saved ? JSON.parse(saved) : [];
  });

  const [caja, setCaja] = useState<MovimientoCaja[]>(() => {
    const saved = localStorage.getItem('cs_caja');
    return saved ? JSON.parse(saved) : [];
  });

  const [compras, setCompras] = useState<CompraRegistro[]>(() => {
    const saved = localStorage.getItem('cs_compras');
    return saved ? JSON.parse(saved) : [];
  });

  // Modales de Importación y Limpieza
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [modalVaciarAbierto, setModalVaciarAbierto] = useState(false);
  const [toastGlobal, setToastGlobal] = useState<{ tipo: 'ok' | 'info'; texto: string } | null>(null);

  const mostrarToast = (texto: string, tipo: 'ok' | 'info' = 'ok') => {
    setToastGlobal({ tipo, texto });
    setTimeout(() => setToastGlobal(null), 4500);
  };

  // Manejador de importación completa de todas las hojas de Excel
  const handleImportarTodo = (datos: {
    productos: Producto[];
    clientes: Cliente[];
    proveedores: Proveedor[];
  }, modo: 'fusionar' | 'reemplazar') => {
    let prodsCount = 0;
    let clisCount = 0;
    let provsCount = 0;

    if (datos.productos && datos.productos.length > 0) {
      if (modo === 'reemplazar') {
        setProductos(datos.productos);
      } else {
        setProductos(prev => {
          const mapa = new Map<string, Producto>();
          prev.forEach(p => mapa.set(p.codigo.toLowerCase().trim(), p));
          datos.productos.forEach(p => {
            const key = p.codigo.toLowerCase().trim();
            if (mapa.has(key)) {
              const actual = mapa.get(key)!;
              actual.existencia += p.existencia;
              if (p.precioVenta > 0) actual.precioVenta = p.precioVenta;
              if (p.precioCompra > 0) actual.precioCompra = p.precioCompra;
            } else {
              mapa.set(key, p);
            }
          });
          return Array.from(mapa.values());
        });
      }
      prodsCount = datos.productos.length;
    }

    if (datos.clientes && datos.clientes.length > 0) {
      if (modo === 'reemplazar') {
        setClientes(datos.clientes);
      } else {
        setClientes(prev => {
          const mapa = new Map<string, Cliente>();
          prev.forEach(c => mapa.set(c.nombre.toLowerCase().trim(), c));
          datos.clientes.forEach(c => mapa.set(c.nombre.toLowerCase().trim(), c));
          return Array.from(mapa.values());
        });
      }
      clisCount = datos.clientes.length;
    }

    if (datos.proveedores && datos.proveedores.length > 0) {
      if (modo === 'reemplazar') {
        setProveedores(datos.proveedores);
      } else {
        setProveedores(prev => {
          const mapa = new Map<string, Proveedor>();
          prev.forEach(pr => mapa.set(pr.nombre.toLowerCase().trim(), pr));
          datos.proveedores.forEach(pr => mapa.set(pr.nombre.toLowerCase().trim(), pr));
          return Array.from(mapa.values());
        });
      }
      provsCount = datos.proveedores.length;
    }

    const partes: string[] = [];
    if (prodsCount > 0) partes.push(`${prodsCount} productos`);
    if (clisCount > 0) partes.push(`${clisCount} clientes`);
    if (provsCount > 0) partes.push(`${provsCount} proveedores`);

    mostrarToast(`¡Éxito! Se importaron todas las hojas del archivo: ${partes.join(', ')}.`);
  };

  // Manejador de importación de productos desde Excel
  const handleImportarProductos = (nuevos: Producto[], modo: 'fusionar' | 'reemplazar') => {
    if (modo === 'reemplazar') {
      setProductos(nuevos);
      mostrarToast(`¡Éxito! Se cargaron ${nuevos.length} productos reemplazando el inventario anterior.`);
    } else {
      setProductos(prev => {
        const mapa = new Map<string, Producto>();
        prev.forEach(p => mapa.set(p.codigo.toLowerCase().trim(), p));
        nuevos.forEach(p => mapa.set(p.codigo.toLowerCase().trim(), p));
        return Array.from(mapa.values());
      });
      mostrarToast(`¡Éxito! Se importaron ${nuevos.length} productos combinados con su catálogo existente.`);
    }
  };

  // Manejador de importación de clientes desde Excel
  const handleImportarClientes = (nuevos: Cliente[], modo: 'fusionar' | 'reemplazar') => {
    if (modo === 'reemplazar') {
      setClientes(nuevos);
      mostrarToast(`¡Éxito! Se importaron ${nuevos.length} clientes a su base de datos.`);
    } else {
      setClientes(prev => {
        const mapa = new Map<string, Cliente>();
        prev.forEach(c => mapa.set(c.nombre.toLowerCase().trim(), c));
        nuevos.forEach(c => mapa.set(c.nombre.toLowerCase().trim(), c));
        return Array.from(mapa.values());
      });
      mostrarToast(`¡Éxito! Directorio actualizado con ${nuevos.length} clientes.`);
    }
  };

  // Manejador de importación de proveedores desde Excel
  const handleImportarProveedores = (nuevos: Proveedor[], modo: 'fusionar' | 'reemplazar') => {
    if (modo === 'reemplazar') {
      setProveedores(nuevos);
      mostrarToast(`¡Éxito! Se importaron ${nuevos.length} proveedores.`);
    } else {
      setProveedores(prev => {
        const mapa = new Map<string, Proveedor>();
        prev.forEach(pr => mapa.set(pr.nombre.toLowerCase().trim(), pr));
        nuevos.forEach(pr => mapa.set(pr.nombre.toLowerCase().trim(), pr));
        return Array.from(mapa.values());
      });
      mostrarToast(`¡Éxito! Se agregaron ${nuevos.length} proveedores a la lista.`);
    }
  };

  // Manejador granular para vaciar la base de datos
  const handleEjecutarLimpieza = (modo: ModoLimpieza) => {
    if (modo === 'todo') {
      setProductos([]);
      setClientes([]);
      setProveedores([]);
      setVentas([]);
      setCreditos([]);
      setAbonos([]);
      setCaja([]);
      setCompras([]);
      setCarrito([]);
      localStorage.removeItem('cs_productos');
      localStorage.removeItem('cs_clientes');
      localStorage.removeItem('cs_proveedores');
      localStorage.removeItem('cs_ventas');
      localStorage.removeItem('cs_creditos');
      localStorage.removeItem('cs_abonos');
      localStorage.removeItem('cs_caja');
      localStorage.removeItem('cs_compras');
      mostrarToast('Se ha vaciado TODA la base de datos (Reset de Fábrica completado).');
    } else if (modo === 'transacciones') {
      setVentas([]);
      setCreditos([]);
      setAbonos([]);
      setCaja([]);
      setCompras([]);
      setCarrito([]);
      localStorage.removeItem('cs_ventas');
      localStorage.removeItem('cs_creditos');
      localStorage.removeItem('cs_abonos');
      localStorage.removeItem('cs_caja');
      localStorage.removeItem('cs_compras');
      mostrarToast('Se vaciaron todas las ventas, créditos, abonos y caja. Productos y clientes conservados.');
    } else if (modo === 'productos') {
      setProductos([]);
      setCarrito([]);
      localStorage.removeItem('cs_productos');
      mostrarToast('Se vació el catálogo de productos. Listo para importar una nueva lista de Excel.');
    }
  };

  // Cart state
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  // Factura modal state
  const [facturaVentaId, setFacturaVentaId] = useState<string | null>(null);
  const [ventaAAnularId, setVentaAAnularId] = useState<string>('');

  // Persist entities
  useEffect(() => {
    localStorage.setItem('cs_productos', JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem('cs_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('cs_proveedores', JSON.stringify(proveedores));
  }, [proveedores]);

  useEffect(() => {
    localStorage.setItem('cs_ventas', JSON.stringify(ventas));
  }, [ventas]);

  useEffect(() => {
    localStorage.setItem('cs_creditos', JSON.stringify(creditos));
  }, [creditos]);

  useEffect(() => {
    localStorage.setItem('cs_abonos', JSON.stringify(abonos));
  }, [abonos]);

  useEffect(() => {
    localStorage.setItem('cs_caja', JSON.stringify(caja));
  }, [caja]);

  useEffect(() => {
    localStorage.setItem('cs_compras', JSON.stringify(compras));
  }, [compras]);

  // Carga inicial y sincronización con Firebase Firestore en la nube
  useEffect(() => {
    let cancelado = false;
    async function sincronizarDesdeNube() {
      try {
        const [
          prodsRemotos,
          clisRemotos,
          provsRemotos,
          ventasRemotas,
          creditosRemotos,
          abonosRemotos,
          cajaRemota,
          comprasRemotas
        ] = await Promise.all([
          firestoreSync.obtenerColeccion<Producto>('productos'),
          firestoreSync.obtenerColeccion<Cliente>('clientes'),
          firestoreSync.obtenerColeccion<Proveedor>('proveedores'),
          firestoreSync.obtenerColeccion<VentaRegistro>('ventas'),
          firestoreSync.obtenerColeccion<Credito>('creditos'),
          firestoreSync.obtenerColeccion<Abono>('abonos'),
          firestoreSync.obtenerColeccion<MovimientoCaja>('caja'),
          firestoreSync.obtenerColeccion<CompraRegistro>('compras')
        ]);

        if (cancelado) return;

        if (prodsRemotos && prodsRemotos.length > 0) setProductos(prodsRemotos);
        if (clisRemotos && clisRemotos.length > 0) setClientes(clisRemotos);
        if (provsRemotos && provsRemotos.length > 0) setProveedores(provsRemotos);
        if (ventasRemotas && ventasRemotas.length > 0) setVentas(ventasRemotas);
        if (creditosRemotos && creditosRemotos.length > 0) setCreditos(creditosRemotos);
        if (abonosRemotos && abonosRemotos.length > 0) setAbonos(abonosRemotos);
        if (cajaRemota && cajaRemota.length > 0) setCaja(cajaRemota);
        if (comprasRemotas && comprasRemotas.length > 0) setCompras(comprasRemotas);
      } catch (err) {
        console.warn('Sincronización inicial con Firestore:', err);
      }
    }

    sincronizarDesdeNube();
    return () => { cancelado = true; };
  }, []);

  // Saldo actual de caja
  const saldoCajaActual = caja.length > 0 ? caja[caja.length - 1].saldo : 0;

  // Cuentas por Cobrar calculadas automáticamente
  const cuentasPorCobrar: CuentaPorCobrar[] = (() => {
    const map: Record<string, CuentaPorCobrar> = {};
    creditos.forEach(c => {
      if (c.estado === 'ANULADO') return;
      if (!map[c.idCliente]) {
        map[c.idCliente] = {
          idCliente: c.idCliente,
          cliente: c.cliente,
          totalCreditos: 0,
          totalAbonado: 0,
          saldoPendiente: 0,
          creditosPendientes: 0,
          estado: 'AL DÍA'
        };
      }
      map[c.idCliente].totalCreditos += c.totalCredito;
      map[c.idCliente].totalAbonado += c.abonado;
      map[c.idCliente].saldoPendiente += c.saldo;
      if (c.saldo > 0.01) {
        map[c.idCliente].creditosPendientes += 1;
      }
    });

    return Object.values(map).map(c => ({
      ...c,
      estado: c.saldoPendiente > 0.01 ? 'PENDIENTE' : 'AL DÍA'
    }));
  })();

  // Login handler
  const handleLogin = (nuevoUsuario: string, nuevoRol: string, emailGoogle?: string) => {
    setUsuario(nuevoUsuario);
    setRol(nuevoRol);
    localStorage.setItem('variedades_cs_user', nuevoUsuario);
    localStorage.setItem('variedades_cs_role', nuevoRol);
    if (emailGoogle) {
      localStorage.setItem('variedades_cs_email', emailGoogle);
    }
  };

  const handleLogout = async () => {
    setUsuario(null);
    localStorage.removeItem('variedades_cs_user');
    localStorage.removeItem('variedades_cs_role');
    localStorage.removeItem('variedades_cs_email');
    try {
      await googleSignOut();
    } catch {
      // Sesión de Google ya cerrada
    }
  };

  // Helper fecha
  const getFechaHora = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // 1. PRODUCTOS CRUD
  const guardarProducto = (prod: Producto) => {
    const existe = productos.some(p => p.codigo === prod.codigo);
    if (existe) {
      setProductos(productos.map(p => p.codigo === prod.codigo ? prod : p));
    } else {
      setProductos([...productos, prod]);
    }
    firestoreSync.guardarDocumento('productos', prod.codigo, prod);
  };

  const eliminarProducto = (codigo: string) => {
    setProductos(productos.filter(p => p.codigo !== codigo));
    firestoreSync.eliminarDocumento('productos', codigo);
  };

  // 2. REGISTRAR VENTA
  const registrarVenta = (datos: {
    items: ItemCarrito[];
    formaPago: string;
    descuento: number;
    idCliente?: string;
    nombreCliente?: string;
    efectivoRecibido?: number;
    cambio?: number;
    fechaVencimiento?: string;
  }) => {
    const numVenta = `V-${String(ventas.length + 1).padStart(5, '0')}`;
    const fechaHora = getFechaHora();
    const usuarioActual = usuario || 'SISTEMA';

    // Descontar existencias
    const nuevosProductos = [...productos];
    for (const item of datos.items) {
      const idx = nuevosProductos.findIndex(p => p.codigo === item.codigo);
      if (idx !== -1) {
        nuevosProductos[idx] = {
          ...nuevosProductos[idx],
          existencia: Math.max(0, nuevosProductos[idx].existencia - item.cantidad)
        };
      }
    }
    setProductos(nuevosProductos);

    // Registrar ventas
    const subtotal = datos.items.reduce((s, it) => s + (it.cantidad * it.precioUnitario), 0);
    const totalFinal = Math.max(0, subtotal - datos.descuento);

    let numCredito = '';
    if (datos.formaPago === 'Crédito') {
      numCredito = `CR-${String(creditos.length + 1).padStart(5, '0')}`;
      const nuevoCredito: Credito = {
        numeroCredito: numCredito,
        fecha: fechaHora.split(' ')[0],
        idCliente: datos.idCliente || 'CLI-0001',
        cliente: datos.nombreCliente || 'Cliente',
        numeroVenta: numVenta,
        totalCredito: totalFinal,
        abonado: 0,
        saldo: totalFinal,
        vencimiento: datos.fechaVencimiento || '',
        estado: 'PENDIENTE'
      };
      setCreditos([nuevoCredito, ...creditos]);
      firestoreSync.guardarDocumento('creditos', numCredito, nuevoCredito);
    }

    const nuevasLineasVenta: VentaRegistro[] = datos.items.map(it => ({
      numeroVenta: numVenta,
      fecha: fechaHora,
      codigo: it.codigo,
      producto: it.producto,
      categoria: it.categoria,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      total: it.cantidad * it.precioUnitario,
      formaPago: datos.formaPago,
      cliente: datos.nombreCliente || 'Consumidor Final',
      idCliente: datos.idCliente,
      efectivoRecibido: datos.efectivoRecibido,
      cambio: datos.cambio,
      numCredito: numCredito,
      usuario: usuarioActual,
      estado: 'COMPLETADA'
    }));

    setVentas([...nuevasLineasVenta, ...ventas]);

    // Sincronización en la nube con Firestore
    nuevasLineasVenta.forEach((l, idx) => {
      firestoreSync.guardarDocumento('ventas', `${numVenta}_${idx}`, l);
    });
    nuevosProductos.forEach(p => {
      firestoreSync.guardarDocumento('productos', p.codigo, p);
    });

    // Actualizar Caja si no es crédito
    if (datos.formaPago !== 'Crédito') {
      const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
      const nuevoMov: MovimientoCaja = {
        id: idCaja,
        fecha: fechaHora,
        tipo: 'Venta',
        concepto: `Venta ${numVenta} (${datos.formaPago})`,
        monto: totalFinal,
        usuario: usuarioActual,
        saldo: saldoCajaActual + totalFinal
      };
      setCaja([...caja, nuevoMov]);
    }

    // Abrir Factura automáticamente
    setFacturaVentaId(numVenta);

    return {
      success: true,
      mensaje: `¡Venta ${numVenta} procesada con éxito por un total de $${totalFinal.toFixed(2)}!`,
      numeroVenta: numVenta
    };
  };

  // 3. ANULAR VENTA
  const anularVenta = (numeroVenta: string, motivo: string) => {
    const lineas = ventas.filter(v => v.numeroVenta.toUpperCase() === numeroVenta.toUpperCase());
    if (!lineas.length) return { success: false, mensaje: `La venta ${numeroVenta} no existe.` };
    if (lineas[0].estado === 'ANULADA') return { success: false, mensaje: `La venta ${numeroVenta} ya fue anulada.` };

    const fechaHora = getFechaHora();
    const usuarioActual = usuario || 'SISTEMA';

    // 1. Reintegrar existencias
    const nuevosProductos = [...productos];
    lineas.forEach(l => {
      const idx = nuevosProductos.findIndex(p => p.codigo === l.codigo);
      if (idx !== -1) {
        nuevosProductos[idx] = {
          ...nuevosProductos[idx],
          existencia: nuevosProductos[idx].existencia + l.cantidad
        };
      }
    });
    setProductos(nuevosProductos);

    // 2. Marcar ventas como ANULADA
    setVentas(ventas.map(v => 
      v.numeroVenta.toUpperCase() === numeroVenta.toUpperCase()
        ? { ...v, estado: 'ANULADA', fechaAnulacion: fechaHora, motivo }
        : v
    ));

    // 3. Revertir fondos en caja si aplica
    const totalVenta = lineas.reduce((s, it) => s + it.total, 0);
    if (lineas[0].formaPago !== 'Crédito') {
      const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
      const nuevoMov: MovimientoCaja = {
        id: idCaja,
        fecha: fechaHora,
        tipo: 'Egreso',
        concepto: `Reverso por Anulación de Venta ${numeroVenta}`,
        monto: -totalVenta,
        usuario: usuarioActual,
        saldo: saldoCajaActual - totalVenta
      };
      setCaja([...caja, nuevoMov]);
    } else if (lineas[0].numCredito) {
      setCreditos(creditos.map(c => 
        c.numeroCredito === lineas[0].numCredito 
          ? { ...c, estado: 'ANULADO', saldo: 0 } 
          : c
      ));
    }

    return {
      success: true,
      mensaje: `Venta ${numeroVenta} ANULADA. ${lineas.length} productos reintegrados al stock y flujo revertido.`
    };
  };

  // 4. REGISTRAR COMPRA
  const registrarCompra = (datos: {
    codigo: string;
    producto: string;
    categoria: string;
    cantidad: number;
    precioCompra: number;
    precioVenta: number;
    proveedor: string;
    pagarDesdeCaja: boolean;
  }) => {
    const numCompra = `C-${String(Date.now()).slice(-5)}`;
    const fechaHora = getFechaHora();
    const totalCompra = datos.cantidad * datos.precioCompra;

    // Aumentar stock
    const idx = productos.findIndex(p => p.codigo === datos.codigo);
    if (idx !== -1) {
      const p = productos[idx];
      productos[idx] = {
        ...p,
        existencia: p.existencia + datos.cantidad,
        precioCompra: datos.precioCompra,
        precioVenta: datos.precioVenta || p.precioVenta
      };
      setProductos([...productos]);
    } else {
      setProductos([...productos, {
        codigo: datos.codigo,
        producto: datos.producto,
        categoria: datos.categoria,
        existencia: datos.cantidad,
        precioCompra: datos.precioCompra,
        precioVenta: datos.precioVenta
      }]);
    }

    // Registrar registro de compra
    const compraRecord: CompraRegistro = {
      numeroCompra: numCompra,
      fecha: fechaHora,
      codigo: datos.codigo,
      producto: datos.producto,
      categoria: datos.categoria,
      cantidad: datos.cantidad,
      precioUnitario: datos.precioCompra,
      total: totalCompra,
      proveedor: datos.proveedor
    };
    setCompras([compraRecord, ...compras]);
    firestoreSync.guardarDocumento('compras', numCompra, compraRecord);

    // Si se paga desde caja
    if (datos.pagarDesdeCaja) {
      const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
      setCaja([...caja, {
        id: idCaja,
        fecha: fechaHora,
        tipo: 'Egreso',
        concepto: `Pago Compra Mercadería ${numCompra} (${datos.producto})`,
        monto: -totalCompra,
        usuario: usuario || 'SISTEMA',
        saldo: saldoCajaActual - totalCompra
      }]);
    }

    return {
      success: true,
      mensaje: `Compra ${numCompra} registrada. Se agregaron ${datos.cantidad} unidades al inventario.`
    };
  };

  // 5. REGISTRAR ABONO
  const registrarAbono = (datos: {
    numeroCredito: string;
    montoAbonado: number;
    metodoPago: string;
    observaciones: string;
  }) => {
    const target = creditos.find(c => c.numeroCredito === datos.numeroCredito);
    if (!target) return { success: false, mensaje: 'Crédito no encontrado.' };

    const nuevoAbonado = target.abonado + datos.montoAbonado;
    const nuevoSaldo = Math.max(0, target.saldo - datos.montoAbonado);
    const nuevoEstado = nuevoSaldo <= 0.01 ? 'PAGADO' : 'PENDIENTE';
    const fechaHora = getFechaHora();
    const numAbono = `AB-${String(abonos.length + 1).padStart(5, '0')}`;

    const creditoActualizado: Credito = {
      ...target,
      abonado: nuevoAbonado,
      saldo: nuevoSaldo,
      estado: nuevoEstado
    };

    // Actualizar crédito
    setCreditos(creditos.map(c => 
      c.numeroCredito === datos.numeroCredito 
        ? creditoActualizado
        : c
    ));

    // Registrar en abonos
    const abonoRecord: Abono = {
      numeroAbono: numAbono,
      fecha: fechaHora,
      numeroCredito: datos.numeroCredito,
      idCliente: target.idCliente,
      cliente: target.cliente,
      montoAbonado: datos.montoAbonado,
      metodoPago: datos.metodoPago,
      observaciones: datos.observaciones
    };
    setAbonos([abonoRecord, ...abonos]);

    // Sincronizar abono y saldo de crédito con Firestore
    firestoreSync.guardarDocumento('abonos', numAbono, abonoRecord);
    firestoreSync.guardarDocumento('creditos', datos.numeroCredito, creditoActualizado);

    // Ingresar dinero a caja
    const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
    const nuevoMovCaja: MovimientoCaja = {
      id: idCaja,
      fecha: fechaHora,
      tipo: 'Abono',
      concepto: `Abono ${numAbono} a ${datos.numeroCredito} (${target.cliente})`,
      monto: datos.montoAbonado,
      usuario: usuario || 'SISTEMA',
      saldo: saldoCajaActual + datos.montoAbonado
    };
    setCaja([...caja, nuevoMovCaja]);
    firestoreSync.guardarDocumento('caja', idCaja, nuevoMovCaja);

    return {
      success: true,
      mensaje: `Abono ${numAbono} recibido por $${datos.montoAbonado.toFixed(2)}. Saldo restante: $${nuevoSaldo.toFixed(2)}.`,
      abono: abonoRecord,
      credito: creditoActualizado
    };
  };

  // 6. CAJA MOVIMIENTO MANUAL Y CIERRE
  const registrarMovimientoCaja = (datos: { tipo: string; concepto: string; monto: number }) => {
    const fechaHora = getFechaHora();
    const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
    const realMonto = datos.tipo === 'Egreso' ? -Math.abs(datos.monto) : Math.abs(datos.monto);
    const nuevoSaldo = saldoCajaActual + realMonto;

    const mov: MovimientoCaja = {
      id: idCaja,
      fecha: fechaHora,
      tipo: datos.tipo,
      concepto: datos.concepto,
      monto: realMonto,
      usuario: usuario || 'SISTEMA',
      saldo: nuevoSaldo
    };

    setCaja([...caja, mov]);
    firestoreSync.guardarDocumento('caja', idCaja, mov);

    return { success: true, mensaje: 'Movimiento de caja registrado exitosamente.' };
  };

  const cerrarCaja = (observaciones: string) => {
    const fechaHora = getFechaHora();
    const idCaja = `CJ-${String(caja.length + 1).padStart(5, '0')}`;
    const movCierre: MovimientoCaja = {
      id: idCaja,
      fecha: fechaHora,
      tipo: 'Cierre de Caja',
      concepto: `Cierre de Turno. ${observaciones || ''}`,
      monto: 0,
      usuario: usuario || 'SISTEMA',
      saldo: saldoCajaActual
    };
    setCaja([...caja, movCierre]);
    firestoreSync.guardarDocumento('caja', idCaja, movCierre);

    return {
      success: true,
      mensaje: `Caja cerrada. Saldo arqueado: $${saldoCajaActual.toFixed(2)}`,
      saldoFinal: saldoCajaActual
    };
  };

  // Clientes y Proveedores handlers
  const guardarCliente = (cli: Cliente) => {
    const exists = clientes.some(c => c.id === cli.id);
    if (exists) setClientes(clientes.map(c => c.id === cli.id ? cli : c));
    else setClientes([...clientes, cli]);
    firestoreSync.guardarDocumento('clientes', cli.id, cli);
  };

  const guardarProveedor = (prov: Proveedor) => {
    const exists = proveedores.some(p => p.id === prov.id);
    if (exists) setProveedores(proveedores.map(p => p.id === prov.id ? prov : p));
    else setProveedores([...proveedores, prov]);
    firestoreSync.guardarDocumento('proveedores', prov.id, prov);
  };

  // Título dinámico
  const titulosVista: Record<string, string> = {
    dashboard: 'Panel de Control (Dashboard)',
    pos: 'Punto de Venta (POS)',
    productos: 'Catálogo e Inventario de Productos',
    ventas: 'Historial de Ventas',
    anular: 'Anulación de Ventas & Reintegros',
    facturas: 'Comprobantes y Notas de Venta',
    compras: 'Gestión de Compras y Reabastecimiento',
    clientes: 'Directorio de Clientes',
    proveedores: 'Directorio de Proveedores',
    creditos: 'Gestión de Créditos y Cobranza',
    cxc: 'Cuentas por Cobrar Consolidado',
    caja: 'Control de Caja Chica y Arqueo Diario',
    inventario: 'Inventario Valorizado',
    gmail: 'Gmail & Correos de Perfumería'
  };

  const handleExportarTodoExcel = () => {
    exportarTodoAExcel({
      productos,
      ventas,
      clientes,
      proveedores,
      creditos,
      abonos,
      compras,
      caja,
      cuentasPorCobrar
    });
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Modal Login si no está logueado */}
      {!usuario && (
        <LoginModal onLoginSuccess={handleLogin} />
      )}

      {/* Sidebar principal */}
      <Sidebar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        usuario={usuario || 'Invitado'}
        rol={rol}
        onLogout={handleLogout}
        carritoCount={carrito.length}
        onExportarExcel={handleExportarTodoExcel}
        onImportarExcel={() => setModalImportarAbierto(true)}
        menuAbiertoMovil={menuAbiertoMovil}
        onCerrarMenuMovil={() => setMenuAbiertoMovil(false)}
        modoSinImagenes={modoSinImagenes}
        onAbrirCambiarPassword={() => setModalCambiarPasswordAbierto(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          titulo={titulosVista[vistaActual] || 'VARIEDADES CS'}
          usuario={usuario || 'Usuario'}
          saldoCaja={saldoCajaActual}
          onExportarExcel={handleExportarTodoExcel}
          onImportarExcel={() => setModalImportarAbierto(true)}
          onLimpiarTodo={() => setModalVaciarAbierto(true)}
          onAbrirMenuMovil={() => setMenuAbiertoMovil(true)}
          modoSinImagenes={modoSinImagenes}
          onToggleModoSinImagenes={toggleModoSinImagenes}
          onAbrirCambiarPassword={() => setModalCambiarPasswordAbierto(true)}
        />

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {vistaActual === 'dashboard' && (
            <DashboardView
              productos={productos}
              ventas={ventas}
              creditos={creditos}
              saldoCaja={saldoCajaActual}
              onNavigate={setVistaActual}
            />
          )}

          {vistaActual === 'pos' && (
            <PosView
              productos={productos}
              clientes={clientes}
              carrito={carrito}
              setCarrito={setCarrito}
              modoSinImagenes={modoSinImagenes}
              onToggleModoSinImagenes={toggleModoSinImagenes}
              onFinalizarVenta={registrarVenta}
            />
          )}

          {vistaActual === 'productos' && (
            <ProductosView
              productos={productos}
              modoSinImagenes={modoSinImagenes}
              onToggleModoSinImagenes={toggleModoSinImagenes}
              onGuardarProducto={guardarProducto}
              onEliminarProducto={eliminarProducto}
              onExportarExcel={() => exportarInventarioExcel(productos)}
              onImportarExcel={() => setModalImportarAbierto(true)}
            />
          )}

          {vistaActual === 'ventas' && (
            <VentasView
              ventas={ventas}
              onVerFactura={(num) => setFacturaVentaId(num)}
              onIrAnular={(num) => {
                setVentaAAnularId(num);
                setVistaActual('anular');
              }}
              onExportarExcel={() => exportarVentasExcel(ventas)}
            />
          )}

          {vistaActual === 'anular' && (
            <AnularVentaView
              ventas={ventas}
              ventaInicial={ventaAAnularId}
              onAnularVenta={anularVenta}
            />
          )}

          {vistaActual === 'facturas' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-sm text-slate-800">Facturación y Notas de Venta</h3>
                <p className="text-xs text-slate-500">Seleccione cualquier venta registrada para previsualizar o imprimir su comprobante térmico oficial.</p>
              </div>
              <VentasView
                ventas={ventas}
                onVerFactura={(num) => setFacturaVentaId(num)}
                onIrAnular={(num) => {
                  setVentaAAnularId(num);
                  setVistaActual('anular');
                }}
                onExportarExcel={() => exportarVentasExcel(ventas)}
              />
            </div>
          )}

          {vistaActual === 'compras' && (
            <ComprasView
              productos={productos}
              proveedores={proveedores}
              compras={compras}
              onRegistrarCompra={registrarCompra}
            />
          )}

          {vistaActual === 'clientes' && (
            <ClientesView
              clientes={clientes}
              onGuardarCliente={guardarCliente}
              onImportarExcel={() => setModalImportarAbierto(true)}
            />
          )}

          {vistaActual === 'proveedores' && (
            <ProveedoresView
              proveedores={proveedores}
              onGuardarProveedor={guardarProveedor}
              onImportarExcel={() => setModalImportarAbierto(true)}
            />
          )}

          {vistaActual === 'creditos' && (
            <CreditosView
              creditos={creditos}
              abonos={abonos}
              clientes={clientes}
              onRegistrarAbono={registrarAbono}
            />
          )}

          {vistaActual === 'cxc' && (
            <CxcView
              cuentasPorCobrar={cuentasPorCobrar}
              clientes={clientes}
            />
          )}

          {vistaActual === 'caja' && (
            <CajaView
              movimientos={caja}
              saldoActual={saldoCajaActual}
              usuario={usuario || 'SISTEMA'}
              onRegistrarMovimiento={registrarMovimientoCaja}
              onCerrarCaja={cerrarCaja}
            />
          )}

          {vistaActual === 'inventario' && (
            <InventarioView
              productos={productos}
              onExportarExcel={() => exportarInventarioExcel(productos)}
            />
          )}

          {vistaActual === 'gmail' && (
            <GmailView
              clientes={clientes}
              ventas={ventas}
              productos={productos}
            />
          )}
        </main>
      </div>

      {/* Modal Factura Imprimible */}
      {facturaVentaId && (
        <FacturaModal
          numeroVenta={facturaVentaId}
          ventas={ventas}
          clientes={clientes}
          onClose={() => setFacturaVentaId(null)}
        />
      )}

      {/* Modal Importar Datos desde Excel */}
      {modalImportarAbierto && (
        <ImportarExcelModal
          onClose={() => setModalImportarAbierto(false)}
          onImportarTodo={handleImportarTodo}
          onImportarProductos={handleImportarProductos}
          onImportarClientes={handleImportarClientes}
          onImportarProveedores={handleImportarProveedores}
        />
      )}

      {/* Modal Vaciar / Reiniciar Base de Datos */}
      {modalVaciarAbierto && (
        <VaciarBaseDatosModal
          onClose={() => setModalVaciarAbierto(false)}
          onConfirmar={handleEjecutarLimpieza}
          onDescargarRespaldo={handleExportarTodoExcel}
          totalProductos={productos.length}
          totalVentas={ventas.length}
          totalCreditos={creditos.length}
        />
      )}

      {/* Modal Cambiar Contraseña / Enviar Enlace de Recuperación */}
      <CambiarPasswordModal
        isOpen={modalCambiarPasswordAbierto}
        onClose={() => setModalCambiarPasswordAbierto(false)}
        usuarioActual={usuario || 'Administrador'}
        emailActual={localStorage.getItem('variedades_cs_remembered_gmail') || 'variedadescs.online@gmail.com'}
        modoSinImagenes={modoSinImagenes}
        onToggleModoSinImagenes={toggleModoSinImagenes}
      />

      {/* Manejador de Enlace de Restablecimiento de Firebase en la URL */}
      <ResetPasswordHandlerModal
        onSuccess={() => {
          mostrarToast('Contraseña restablecida correctamente. Ya puedes acceder con tu nueva clave.', 'info');
        }}
      />

      {/* Notificación Toast Flotante */}
      {toastGlobal && (
        <div className="fixed bottom-20 md:bottom-5 right-4 md:right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">{toastGlobal.texto}</p>
        </div>
      )}

      {/* Barra de Navegación Inferior Adaptada para Teléfonos (Mobile App Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around h-16 px-2 select-none shadow-2xl">
        <button
          onClick={() => setVistaActual('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            vistaActual === 'dashboard' ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Inicio</span>
        </button>

        <button
          onClick={() => setVistaActual('pos')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition relative ${
            vistaActual === 'pos' ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">POS</span>
          {carrito.length > 0 && (
            <span className="absolute top-1 right-3 sm:right-6 w-4 h-4 rounded-full bg-pink-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
              {carrito.reduce((acc, it) => acc + it.cantidad, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setVistaActual('productos')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            vistaActual === 'productos' ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Productos</span>
        </button>

        <button
          onClick={() => setVistaActual('ventas')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition ${
            vistaActual === 'ventas' ? 'text-blue-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Ventas</span>
        </button>

        <button
          onClick={() => setMenuAbiertoMovil(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-400 hover:text-slate-200 transition"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Menú</span>
        </button>
      </nav>
    </div>
  );
}
