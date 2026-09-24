import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  X, 
  Check, 
  FileSpreadsheet, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ImageIcon,
  ImageOff,
  Coins,
  ArrowRightLeft,
  Tag,
  Layers,
  TrendingUp,
  Building2,
  PlusCircle,
  FlaskConical
} from 'lucide-react';
import { Producto } from '../types';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';
import { 
  MARCAS_PERFUMES_POPULARES, 
  buscarImagenesPorMarca, 
  obtenerImagenSugerida,
  ImagenPerfume
} from '../utils/perfumeBrands';

const CATEGORIAS_RAPIDAS = [
  'Perfumes',
  'Cosméticos',
  'Bolsos',
  'Cuidado Personal',
  'Ropa',
  'Calzado',
  'Accesorios',
  'General'
];

const MARCAS_RAPIDAS = [
  'Carolina Herrera',
  'Dior',
  'Chanel',
  'Paco Rabanne',
  'Versace',
  "Victoria's Secret",
  'Guess',
  'Calvin Klein'
];

interface ProductosProps {
  productos: Producto[];
  tasaCambio?: number;
  onAbrirModalTasa?: () => void;
  onGuardarProducto: (prod: Producto) => void;
  onEliminarProducto: (codigo: string) => void;
  onExportarExcel?: () => void;
  onImportarExcel?: () => void;
  modoSinImagenes?: boolean;
  onToggleModoSinImagenes?: () => void;
}

export const ProductosView: React.FC<ProductosProps> = ({
  productos,
  tasaCambio = 36.62,
  onAbrirModalTasa,
  onGuardarProducto,
  onEliminarProducto,
  onExportarExcel,
  onImportarExcel,
  modoSinImagenes = false,
  onToggleModoSinImagenes
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);
  
  // Estado para confirmación de eliminación in-app (evita problemas de iframe con window.confirm)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null);
  const [modalConfirmarQuitarTodas, setModalConfirmarQuitarTodas] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Form state
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formImagen, setFormImagen] = useState('');
  const [formSinImagen, setFormSinImagen] = useState(false);
  const [formExistencia, setFormExistencia] = useState(0);
  const [formMililitros, setFormMililitros] = useState<string>('');
  const [monedaPrecios, setMonedaPrecios] = useState<'NIO' | 'USD'>('NIO');
  const [formPrecioCompraUSD, setFormPrecioCompraUSD] = useState<string>('15.00');
  const [formPrecioCompraNIO, setFormPrecioCompraNIO] = useState<string>('');
  const [formPrecioVentaUSD, setFormPrecioVentaUSD] = useState<string>('25.00');
  const [formPrecioVentaNIO, setFormPrecioVentaNIO] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Generar siguiente código automático
  const generarSiguienteCodigo = (lista: Producto[] = productos): string => {
    let maxNum = 0;
    lista.forEach(p => {
      const match = p.codigo.match(/^P(\d+)$/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    if (maxNum === 0) {
      maxNum = lista.length;
    }
    return `P${String(maxNum + 1).padStart(3, '0')}`;
  };

  // Sincronizar precios de compra (con soporte de coma y punto decimal)
  const handleCompraUSDChange = (valStr: string) => {
    setFormPrecioCompraUSD(valStr);
    const sanitized = valStr.replace(',', '.');
    const val = parseFloat(sanitized);
    if (!isNaN(val) && val >= 0) {
      setFormPrecioCompraNIO((val * tasaCambio).toFixed(2));
    } else {
      setFormPrecioCompraNIO('');
    }
  };

  const handleCompraNIOChange = (valStr: string) => {
    setFormPrecioCompraNIO(valStr);
    const sanitized = valStr.replace(',', '.');
    const val = parseFloat(sanitized);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setFormPrecioCompraUSD((val / tasaCambio).toFixed(2));
    } else {
      setFormPrecioCompraUSD('');
    }
  };

  // Sincronizar precios de venta (con soporte de coma y punto decimal)
  const handleVentaUSDChange = (valStr: string) => {
    setFormPrecioVentaUSD(valStr);
    const sanitized = valStr.replace(',', '.');
    const val = parseFloat(sanitized);
    if (!isNaN(val) && val >= 0) {
      setFormPrecioVentaNIO((val * tasaCambio).toFixed(2));
    } else {
      setFormPrecioVentaNIO('');
    }
  };

  const handleVentaNIOChange = (valStr: string) => {
    setFormPrecioVentaNIO(valStr);
    const sanitized = valStr.replace(',', '.');
    const val = parseFloat(sanitized);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setFormPrecioVentaUSD((val / tasaCambio).toFixed(2));
    } else {
      setFormPrecioVentaUSD('');
    }
  };

  // Selector visual de imágenes por marca
  const [mostrarSelectorImagenes, setMostrarSelectorImagenes] = useState(false);
  const [imagenesEncontradas, setImagenesEncontradas] = useState<ImagenPerfume[]>([]);

  const categorias = Array.from(new Set(productos.map(p => p.categoria).filter(Boolean)));

  const productosFiltrados = productos.filter(p => {
    const mlTexto = p.mililitros ? `${p.mililitros}ml ${p.mililitros} ml` : '';
    const matchText = p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                      p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                      (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase())) ||
                      mlTexto.toLowerCase().includes(busqueda.toLowerCase());
    const matchCat = categoriaFiltro ? p.categoria === categoriaFiltro : true;
    return matchText && matchCat;
  });

  const abrirModalNuevo = () => {
    setProductoEditar(null);
    setFormCodigo(generarSiguienteCodigo());
    setFormNombre('');
    setFormCategoria('Perfumes');
    setFormMarca('');
    setFormMililitros('');
    setFormImagen('');
    setFormSinImagen(false);
    setFormExistencia(10);
    setMonedaPrecios('NIO');
    setFormPrecioCompraUSD('15.00');
    setFormPrecioCompraNIO((15.00 * tasaCambio).toFixed(2));
    setFormPrecioVentaUSD('25.00');
    setFormPrecioVentaNIO((25.00 * tasaCambio).toFixed(2));
    setErrorMsg('');
    setMostrarSelectorImagenes(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod: Producto) => {
    setProductoEditar(prod);
    setFormCodigo(prod.codigo);
    setFormNombre(prod.producto);
    setFormCategoria(prod.categoria);
    setFormMarca(prod.marca || '');
    setFormMililitros(prod.mililitros ? String(prod.mililitros) : '');
    setFormImagen(prod.imagen || '');
    setFormSinImagen(prod.sinImagen === true || !prod.imagen);
    setFormExistencia(prod.existencia);
    
    const compUSD = prod.precioCompra;
    setFormPrecioCompraUSD(compUSD.toFixed(2));
    const compNIO = prod.precioCompraCordobas || (compUSD * tasaCambio);
    setFormPrecioCompraNIO(compNIO.toFixed(2));

    const ventUSD = prod.precioVenta;
    setFormPrecioVentaUSD(ventUSD.toFixed(2));
    const ventNIO = prod.precioVentaCordobas || (ventUSD * tasaCambio);
    setFormPrecioVentaNIO(ventNIO.toFixed(2));

    setErrorMsg('');
    setMostrarSelectorImagenes(false);
    setModalAbierto(true);
  };

  // Buscar y autoseleccionar imagen según la marca ingresada
  const handleBuscarImagenPorMarca = (marcaSeleccionada?: string) => {
    const termino = marcaSeleccionada !== undefined ? marcaSeleccionada : (formMarca || formNombre);
    const encontradas = buscarImagenesPorMarca(termino);
    setImagenesEncontradas(encontradas);
    setMostrarSelectorImagenes(true);

    if (encontradas.length > 0 && !formImagen && !formSinImagen) {
      setFormImagen(encontradas[0].url);
    }
  };

  const seleccionarMarca = (marca: string) => {
    setFormMarca(marca);
    if (!formSinImagen) {
      const sugerida = obtenerImagenSugerida(marca, formNombre);
      setFormImagen(sugerida);
      const encontradas = buscarImagenesPorMarca(marca);
      setImagenesEncontradas(encontradas);
    }
  };

  const confirmarEliminar = (prod: Producto) => {
    setProductoAEliminar(prod);
  };

  const ejecutarEliminacion = () => {
    if (!productoAEliminar) return;
    const cod = productoAEliminar.codigo;
    const nom = productoAEliminar.producto;
    onEliminarProducto(cod);
    setProductoAEliminar(null);
    if (modalAbierto && productoEditar?.codigo === cod) {
      setModalAbierto(false);
    }
    setToastMensaje(`Producto "${cod} - ${nom}" eliminado del catálogo.`);
    setTimeout(() => setToastMensaje(null), 3500);
  };

  // Quitar imágenes a todos los productos del inventario
  const ejecutarQuitarImagenesATodos = () => {
    productos.forEach(p => {
      onGuardarProducto({
        ...p,
        imagen: '',
        sinImagen: true
      });
    });
    setModalConfirmarQuitarTodas(false);
    setToastMensaje('¡Se han quitado las imágenes a todos los productos exitosamente!');
    setTimeout(() => setToastMensaje(null), 3500);
  };

  const guardar = (e: React.FormEvent, agregarOtro: boolean = false) => {
    e.preventDefault();
    const codLimpio = formCodigo.trim().toUpperCase();
    const nomLimpio = formNombre.trim();

    if (!codLimpio) {
      setErrorMsg('El código del producto es obligatorio.');
      return;
    }

    if (!nomLimpio) {
      setErrorMsg('El nombre del producto o fragancia es obligatorio.');
      return;
    }

    // Respetar opción de no llevar imagen o imagen asignada
    const imagenFinal = formSinImagen ? '' : formImagen.trim();

    const pCompUSD = parseFloat((formPrecioCompraUSD || '0').replace(',', '.')) || 0;
    const pCompNIO = parseFloat((formPrecioCompraNIO || '0').replace(',', '.')) || (pCompUSD * tasaCambio);
    const pVentUSD = parseFloat((formPrecioVentaUSD || '0').replace(',', '.')) || 0;
    const pVentNIO = parseFloat((formPrecioVentaNIO || '0').replace(',', '.')) || (pVentUSD * tasaCambio);

    if (pVentUSD <= 0 && pVentNIO <= 0) {
      setErrorMsg('Por favor ingresa un precio de venta válido mayor a cero.');
      return;
    }

    const mlNum = formMililitros.trim() ? parseFloat(formMililitros.trim().replace(',', '.')) : undefined;
    const mililitrosFinal = (mlNum && !isNaN(mlNum) && mlNum > 0) ? mlNum : undefined;

    const productoAGuardar: Producto = {
      codigo: codLimpio,
      producto: nomLimpio,
      categoria: formCategoria.trim() || 'General',
      marca: formMarca.trim() || undefined,
      mililitros: mililitrosFinal,
      imagen: imagenFinal,
      sinImagen: formSinImagen || !imagenFinal,
      existencia: Math.max(0, Number(formExistencia) || 0),
      precioCompra: pCompUSD,
      precioCompraCordobas: pCompNIO,
      precioVenta: pVentUSD,
      precioVentaCordobas: pVentNIO
    };

    onGuardarProducto(productoAGuardar);

    if (agregarOtro) {
      const listaSimulada = [...productos.filter(p => p.codigo !== codLimpio), productoAGuardar];
      const sigCodigo = generarSiguienteCodigo(listaSimulada);
      setProductoEditar(null);
      setFormCodigo(sigCodigo);
      setFormNombre('');
      setFormMarca('');
      setFormMililitros('');
      setFormImagen('');
      setFormSinImagen(false);
      setFormExistencia(10);
      setErrorMsg('');
      setMostrarSelectorImagenes(false);
      setToastMensaje(`¡"${codLimpio} - ${nomLimpio}" guardado con éxito! Listo para registrar el siguiente.`);
    } else {
      setModalAbierto(false);
      setToastMensaje(`¡Producto "${codLimpio} - ${nomLimpio}" guardado con éxito!`);
    }
    setTimeout(() => setToastMensaje(null), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Notificación Toast */}
      {toastMensaje && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in border border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMensaje}</span>
          </div>
          <button onClick={() => setToastMensaje(null)} className="text-slate-400 hover:text-white ml-3">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Barra superior de acciones */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código o producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Botón Quitar imágenes a todos */}
          <button
            onClick={() => setModalConfirmarQuitarTodas(true)}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Quitar las fotos de todos los productos y dejarlos en modo solo texto"
          >
            <ImageOff className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">Quitar Fotos a Todos</span>
          </button>

          {onImportarExcel && (
            <button
              onClick={onImportarExcel}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Importar productos desde hoja de Excel (.xlsx, .csv)"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Importar Excel</span>
            </button>
          )}

          {onExportarExcel && (
            <button
              onClick={onExportarExcel}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Exportar inventario a Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
          )}

          <button
            onClick={abrirModalNuevo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-xs text-slate-800">Catálogo de Productos & Precios</span>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            {productosFiltrados.length} de {productos.length} productos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-12 text-center">Foto</th>
                <th className="px-3 py-3">Código</th>
                <th className="px-4 py-3">Producto / Marca</th>
                <th className="px-3 py-3">Categoría</th>
                <th className="px-3 py-3 text-center">Existencia</th>
                <th className="px-3 py-3 text-right">P. Compra ($ / C$)</th>
                <th className="px-3 py-3 text-right">P. Venta ($ / C$)</th>
                <th className="px-3 py-3 text-center">Estado</th>
                <th className="px-3 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productosFiltrados.map(prod => {
                const esAgotado = prod.existencia <= 0;
                const sinFoto = modoSinImagenes || prod.sinImagen || !prod.imagen;
                const imgUrl = !sinFoto ? prod.imagen : '';

                return (
                  <tr key={prod.codigo} className="hover:bg-slate-50/80 transition">
                    {/* Foto del Perfume / Producto o icono sin imagen */}
                    <td className="px-3 py-2 text-center">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mx-auto shadow-2xs flex items-center justify-center">
                        {!sinFoto && imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={prod.producto}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-slate-800">{prod.codigo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{prod.producto}</span>
                        {prod.mililitros && (
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200 shadow-2xs">
                            {prod.mililitros} ml
                          </span>
                        )}
                      </div>
                      {prod.marca && (
                        <span className="inline-block text-[10px] font-semibold text-pink-700 bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200 mt-0.5">
                          {prod.marca}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500">{prod.categoria}</td>
                    <td className="px-3 py-3 text-center font-bold">
                      {esAgotado ? (
                        <span className="text-rose-600 font-extrabold">0</span>
                      ) : (
                        <span className="text-slate-800">{prod.existencia}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-bold text-slate-700 block">{formatoUSD(prod.precioCompra)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatoNIO(prod.precioCompraCordobas || (prod.precioCompra * tasaCambio))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-extrabold text-blue-600 block">{formatoUSD(prod.precioVenta)}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 inline-block">
                        {formatoNIO(prod.precioVentaCordobas || (prod.precioVenta * tasaCambio))}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {esAgotado ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          AGOTADO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          En Stock
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => abrirModalEditar(prod)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar producto"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(prod)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Eliminar producto del catálogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron productos con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Horizontal Agregar / Editar Producto */}
      {modalAbierto && (() => {
        const pCompCalc = parseFloat((formPrecioCompraUSD || '0').replace(',', '.')) || 0;
        const pVentCalc = parseFloat((formPrecioVentaUSD || '0').replace(',', '.')) || 0;
        const gananciaUnitUSD = Math.max(0, pVentCalc - pCompCalc);
        const gananciaUnitNIO = gananciaUnitUSD * tasaCambio;
        const margenPct = pVentCalc > 0 ? ((gananciaUnitUSD / pVentCalc) * 100) : 0;
        const stockActual = Math.max(0, Number(formExistencia) || 0);
        const inversionStockUSD = stockActual * pCompCalc;
        const ventaEstimadaUSD = stockActual * pVentCalc;
        const codigoYaExiste = !productoEditar && productos.some(p => p.codigo.trim().toUpperCase() === formCodigo.trim().toUpperCase());

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl xl:max-w-6xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto animate-scale-in">
              
              {/* Encabezado Horizontal */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">
                        {productoEditar ? `Editar Producto: ${formCodigo}` : 'Registro de Producto (Catálogo e Inventario)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {productoEditar ? 'Modo Edición' : 'Nuevo Registro'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 hidden sm:block">
                      Formulario horizontal con cálculo automático de precios, conversión de divisas y stock.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Badge de Tasa Bancaria */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-emerald-300">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold hidden md:inline text-slate-300">Tasa Oficial:</span>
                    <span className="font-black font-mono">1 $ = C$ {tasaCambio.toFixed(2)}</span>
                    {onAbrirModalTasa && (
                      <button
                        type="button"
                        onClick={onAbrirModalTasa}
                        className="ml-1 text-[10px] text-emerald-400 hover:text-white underline font-bold"
                        title="Cambiar Tasa de Cambio"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Cerrar ventana"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mensaje de Error si hay */}
              {errorMsg && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cuerpo del Formulario en 3 Columnas Horizontales */}
              <form onSubmit={e => guardar(e, false)} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6">
                    
                    {/* COLUMNA 1: IDENTIFICACIÓN Y DATOS BÁSICOS (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-800">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <h4 className="font-bold text-xs uppercase tracking-wide">1. Datos del Producto</h4>
                        </div>

                        {/* Código de Producto */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-xs text-slate-700">Código de Producto *</label>
                            {!productoEditar && (
                              <button
                                type="button"
                                onClick={() => setFormCodigo(generarSiguienteCodigo())}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                              >
                                <PlusCircle className="w-3 h-3" />
                                <span>Autogenerar</span>
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={formCodigo}
                              disabled={!!productoEditar}
                              onChange={e => setFormCodigo(e.target.value)}
                              placeholder="Ej: P001"
                              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                            />
                          </div>
                          {codigoYaExiste ? (
                            <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                              <span>⚠️ Este código ya existe en el catálogo. Si guardas, se actualizará este producto.</span>
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-400 mt-1">Identificador único del producto o código de barra</p>
                          )}
                        </div>

                        {/* Nombre del Producto / Fragancia */}
                        <div>
                          <label className="block font-bold text-xs text-slate-700 mb-1">
                            Nombre del Producto / Fragancia *
                          </label>
                          <input
                            type="text"
                            required
                            value={formNombre}
                            onChange={e => {
                              const nuevoNombre = e.target.value;
                              setFormNombre(nuevoNombre);
                              if (!formImagen && formMarca && !formSinImagen) {
                                setFormImagen(obtenerImagenSugerida(formMarca, nuevoNombre));
                              }
                            }}
                            placeholder="Ej: Good Girl, Sauvage, Bombshell, Bolso Michael..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                          />
                        </div>

                        {/* Marca del Producto */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-xs text-slate-700">Marca / Fabricante</label>
                            <span className="text-[10px] text-slate-400">Opcional</span>
                          </div>
                          <input
                            type="text"
                            list="lista-marcas-horiz"
                            value={formMarca}
                            onChange={e => seleccionarMarca(e.target.value)}
                            placeholder="Ej: Carolina Herrera, Dior, Chanel..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                          />
                          <datalist id="lista-marcas-horiz">
                            {MARCAS_PERFUMES_POPULARES.map(m => (
                              <option key={m} value={m} />
                            ))}
                          </datalist>

                          {/* Chips rápidos de marcas populares */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {MARCAS_RAPIDAS.slice(0, 5).map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => seleccionarMarca(m)}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition cursor-pointer ${
                                  formMarca.toLowerCase() === m.toLowerCase()
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mililitros (ml) - Opcional */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Contenido / Mililitros (ml)</span>
                            </label>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                              Opcional
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={formMililitros}
                              onChange={e => setFormMililitros(e.target.value)}
                              placeholder="Ej: 100, 50, 75, 200..."
                              className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-indigo-600">
                              ml
                            </span>
                          </div>

                          {/* Chips rápidos de mililitros estándar de perfumería */}
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-slate-400 mr-0.5 font-medium">Rápidos:</span>
                            {[30, 50, 75, 100, 125, 150, 200].map(ml => (
                              <button
                                key={ml}
                                type="button"
                                onClick={() => setFormMililitros(String(ml))}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition cursor-pointer ${
                                  formMililitros === String(ml)
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                                }`}
                              >
                                {ml} ml
                              </button>
                            ))}
                            {formMililitros && (
                              <button
                                type="button"
                                onClick={() => setFormMililitros('')}
                                className="text-[10px] text-rose-500 hover:underline px-1 ml-auto cursor-pointer"
                              >
                                Limpiar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Categoría */}
                        <div>
                          <label className="block font-bold text-xs text-slate-700 mb-1">Categoría</label>
                          <input
                            type="text"
                            value={formCategoria}
                            onChange={e => setFormCategoria(e.target.value)}
                            placeholder="Ej: Perfumes, Cremas, Bolsos..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                          />
                          {/* Chips rápidos de categorías */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {CATEGORIAS_RAPIDAS.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setFormCategoria(c)}
                                className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold transition cursor-pointer ${
                                  formCategoria.toLowerCase() === c.toLowerCase()
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Stock / Existencia */}
                        <div className="pt-2 border-t border-slate-200">
                          <label className="block font-bold text-xs text-slate-800 mb-1">
                            Existencia Inicial (Stock en Unidades) *
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFormExistencia(prev => Math.max(0, prev - 1))}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={formExistencia}
                              onChange={e => setFormExistencia(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 text-center px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-black focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setFormExistencia(prev => prev + 1)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                            <div className="flex items-center gap-1 ml-auto">
                              {[5, 10, 20].map(n => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setFormExistencia(prev => prev + n)}
                                  className="text-[10px] px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                                >
                                  +{n}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: FOTO Y PRESENTACIÓN (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2 text-slate-800">
                            <ImageIcon className="w-4 h-4 text-pink-600" />
                            <h4 className="font-bold text-xs uppercase tracking-wide">2. Foto y Presentación</h4>
                          </div>
                        </div>

                        {/* Switch Modo con imagen vs sin imagen */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setFormSinImagen(false)}
                            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              !formSinImagen
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Con Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormSinImagen(true);
                              setFormImagen('');
                              setMostrarSelectorImagenes(false);
                            }}
                            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              formSinImagen
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 bg-transparent'
                            }`}
                          >
                            <ImageOff className="w-3.5 h-3.5" />
                            <span>Sin Foto</span>
                          </button>
                        </div>

                        {!formSinImagen ? (
                          <div className="space-y-3">
                            {/* Previsualizador de la imagen */}
                            <div className="relative rounded-2xl overflow-hidden bg-white border-2 border-dashed border-pink-200 p-2 flex flex-col items-center justify-center min-h-[160px]">
                              {formImagen ? (
                                <div className="relative w-full flex flex-col items-center">
                                  <img
                                    src={formImagen}
                                    alt="Vista previa"
                                    className="h-32 w-auto max-w-full object-contain rounded-xl shadow-xs"
                                    onError={() => setFormImagen('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80')}
                                  />
                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleBuscarImagenPorMarca()}
                                      className="text-[11px] font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3 text-pink-600" />
                                      <span>Cambiar por Marca</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormImagen('');
                                        setFormSinImagen(true);
                                      }}
                                      className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer px-1"
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center p-3 space-y-2">
                                  <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center mx-auto">
                                    <ImageIcon className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-xs text-slate-700">Sin foto asignada aún</p>
                                    <p className="text-[10px] text-slate-400">Puedes buscar por marca o pegar un enlace web directo</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleBuscarImagenPorMarca()}
                                    className="text-[11px] font-bold text-white bg-pink-600 hover:bg-pink-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mx-auto transition cursor-pointer shadow-xs"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Buscar Foto Automática</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Campo para ingresar enlace URL manual */}
                            <div>
                              <label className="block font-bold text-slate-700 text-[11px] mb-1">
                                Enlace URL de imagen en internet (Opcional):
                              </label>
                              <input
                                type="url"
                                value={formImagen}
                                onChange={e => setFormImagen(e.target.value)}
                                placeholder="https://ejemplo.com/foto-perfume.jpg"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 text-[11px] focus:ring-2 focus:ring-pink-500 outline-none"
                              />
                            </div>

                            {/* Galería de imágenes sugeridas si se abrió */}
                            {mostrarSelectorImagenes && imagenesEncontradas.length > 0 && (
                              <div className="p-2.5 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-pink-900 uppercase">
                                    Fotos para {formMarca || 'este producto'}:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setMostrarSelectorImagenes(false)}
                                    className="text-[10px] text-slate-400 hover:text-slate-700 cursor-pointer"
                                  >
                                    Cerrar
                                  </button>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1">
                                  {imagenesEncontradas.map((img, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setFormImagen(img.url);
                                        setMostrarSelectorImagenes(false);
                                      }}
                                      className={`group relative rounded-lg overflow-hidden border transition cursor-pointer ${
                                        formImagen === img.url
                                          ? 'border-pink-600 ring-2 ring-pink-400 shadow-md'
                                          : 'border-slate-200 hover:border-pink-400'
                                      }`}
                                      title={img.nombre}
                                    >
                                      <img src={img.url} alt={img.nombre} className="w-full h-10 object-cover" />
                                      <div className="absolute inset-0 bg-pink-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition">
                                        Elegir
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                              <ImageOff className="w-5 h-5" />
                            </div>
                            <h5 className="font-bold text-xs text-amber-900">Modo Sin Imagen Activo</h5>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              Este producto se registrará sin cargar fotos. Se mostrará con un elegante ícono genérico en el punto de venta (POS) y catálogo, optimizando la velocidad del sistema.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COLUMNA 3: PRECIOS, MONEDA Y RENTABILIDAD (lg:col-span-4) */}
                    <div className="lg:col-span-4 space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2 text-slate-800">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-bold text-xs uppercase tracking-wide">3. Precios y Rentabilidad</h4>
                          </div>
                        </div>

                        {/* Selector de Moneda de Entrada */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Moneda de fijación de precios:
                          </label>
                          <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setMonedaPrecios('NIO')}
                              className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                monedaPrecios === 'NIO'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>C$ Córdobas (NIO)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMonedaPrecios('USD')}
                              className={`py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                                monedaPrecios === 'USD'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>$ Dólares (USD)</span>
                            </button>
                          </div>
                        </div>

                        {/* PRECIO DE COMPRA (COSTO) */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-xs text-slate-800">
                              Precio de Compra (Costo Unitario) *
                            </label>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              Conversión automática
                            </span>
                          </div>

                          {monedaPrecios === 'NIO' ? (
                            <div className="space-y-1">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formPrecioCompraNIO}
                                  onChange={e => handleCompraNIOChange(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-8 pr-3 py-1.5 border border-emerald-400 rounded-lg font-black text-slate-900 text-sm focus:ring-2 focus:ring-emerald-400 outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-between px-2 py-0.5 bg-slate-50 rounded text-[11px] text-slate-500">
                                <span>Equivalente en Dólares ($):</span>
                                <span className="font-bold text-blue-700 font-mono">
                                  ${pCompCalc.toFixed(2)} USD
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formPrecioCompraUSD}
                                  onChange={e => handleCompraUSDChange(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-3 py-1.5 border border-blue-400 rounded-lg font-black text-slate-900 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                              </div>
                              <div className="flex items-center justify-between px-2 py-0.5 bg-slate-50 rounded text-[11px] text-slate-500">
                                <span>Equivalente en Córdobas (C$):</span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  C$ {(pCompCalc * tasaCambio).toFixed(2)} NIO
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PRECIO DE VENTA AL PÚBLICO (PVP) */}
                        <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-xs text-blue-950">
                              Precio de Venta al Público (PVP) *
                            </label>
                            {gananciaUnitUSD > 0 && (
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                +{margenPct.toFixed(1)}% Margen
                              </span>
                            )}
                          </div>

                          {monedaPrecios === 'NIO' ? (
                            <div className="space-y-1">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formPrecioVentaNIO}
                                  onChange={e => handleVentaNIOChange(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-8 pr-3 py-1.5 border-2 border-emerald-500 rounded-lg font-black text-emerald-700 text-base focus:ring-2 focus:ring-emerald-400 outline-none shadow-2xs"
                                />
                              </div>
                              <div className="flex items-center justify-between px-2 py-0.5 bg-blue-50 rounded text-[11px] text-slate-600">
                                <span>Equivalente en Dólares ($):</span>
                                <span className="font-bold text-blue-700 font-mono">
                                  ${pVentCalc.toFixed(2)} USD
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formPrecioVentaUSD}
                                  onChange={e => handleVentaUSDChange(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full pl-7 pr-3 py-1.5 border-2 border-blue-500 rounded-lg font-black text-blue-600 text-base focus:ring-2 focus:ring-blue-400 outline-none shadow-2xs"
                                />
                              </div>
                              <div className="flex items-center justify-between px-2 py-0.5 bg-blue-50 rounded text-[11px] text-slate-600">
                                <span>Equivalente en Córdobas (C$):</span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  C$ {(pVentCalc * tasaCambio).toFixed(2)} NIO
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* TARJETA DE RENTABILIDAD Y RETORNO ESTIMADO */}
                        <div className="p-3 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl border border-emerald-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-900 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              Ganancia Neta por Unidad:
                            </span>
                            <span className="font-black text-emerald-700 font-mono">
                              +${gananciaUnitUSD.toFixed(2)} / +C$ {gananciaUnitNIO.toFixed(2)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[10px]">
                            <div>
                              <span className="text-slate-500 block">Inversión ({stockActual} unids):</span>
                              <span className="font-bold text-slate-800 font-mono">
                                ${inversionStockUSD.toFixed(2)} USD
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block">Venta estimada:</span>
                              <span className="font-bold text-emerald-800 font-mono">
                                ${ventaEstimadaUSD.toFixed(2)} USD
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Barra de Acciones Fija Inferior */}
                <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
                  {productoEditar ? (
                    <button
                      type="button"
                      onClick={() => {
                        setModalAbierto(false);
                        confirmarEliminar(productoEditar);
                      }}
                      className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1.5 transition text-xs cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar del Catálogo</span>
                    </button>
                  ) : (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Listo para añadir al inventario</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setModalAbierto(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-white text-xs transition cursor-pointer"
                    >
                      Cancelar
                    </button>

                    {!productoEditar && (
                      <button
                        type="button"
                        onClick={e => guardar(e, true)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                        title="Guardar y mantener abierto para registrar el siguiente producto"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>Guardar y Agregar Otro</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{productoEditar ? 'Guardar Cambios' : 'Guardar Producto'}</span>
                    </button>
                  </div>
                </div>
              </form>

            </div>
          </div>
        );
      })()}

      {/* Modal In-App de Confirmación de Eliminación de Producto */}
      {productoAEliminar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-scale-in">
            <div className="p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h4 className="font-bold text-base text-slate-900 mb-1">
                ¿Eliminar Producto del Catálogo?
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Esta acción removerá el producto permanentemente de la base de datos y del catálogo.
              </p>

              {/* Tarjeta del producto a eliminar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs mb-4 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Código:</span>
                  <span className="font-mono font-bold text-slate-800">{productoAEliminar.codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Producto:</span>
                  <span className="font-semibold text-slate-900">{productoAEliminar.producto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Categoría:</span>
                  <span className="text-slate-700">{productoAEliminar.categoria}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Stock Actual:</span>
                  <span className="font-bold text-slate-800">{productoAEliminar.existencia} unidades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Precio Venta:</span>
                  <span className="font-bold text-blue-600">${productoAEliminar.precioVenta.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductoAEliminar(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={ejecutarEliminacion}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Sí, Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Quitar Imágenes a TODOS los Productos */}
      {modalConfirmarQuitarTodas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ImageOff className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-base text-slate-900 mb-1">
              ¿Quitar fotos a todos los productos?
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Esta acción modificará los <strong>{productos.length}</strong> productos del catálogo para que no lleven imagen (modo texto rápido).
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalConfirmarQuitarTodas(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarQuitarImagenesATodos}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <ImageOff className="w-4 h-4" />
                <span>Sí, Quitar Fotos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
