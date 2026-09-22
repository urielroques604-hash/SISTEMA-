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
  ArrowRightLeft
} from 'lucide-react';
import { Producto } from '../types';
import { formatoUSD, formatoNIO, aCordobas, aDolares } from '../utils/currency';
import { 
  MARCAS_PERFUMES_POPULARES, 
  buscarImagenesPorMarca, 
  obtenerImagenSugerida,
  ImagenPerfume
} from '../utils/perfumeBrands';

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
  tasaCambio = 36.65,
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
  const [monedaPrecios, setMonedaPrecios] = useState<'NIO' | 'USD'>('NIO');
  const [formPrecioCompraUSD, setFormPrecioCompraUSD] = useState<string>('15.00');
  const [formPrecioCompraNIO, setFormPrecioCompraNIO] = useState<string>('');
  const [formPrecioVentaUSD, setFormPrecioVentaUSD] = useState<string>('25.00');
  const [formPrecioVentaNIO, setFormPrecioVentaNIO] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar precios de compra
  const handleCompraUSDChange = (valStr: string) => {
    setFormPrecioCompraUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setFormPrecioCompraNIO((val * tasaCambio).toFixed(2));
    } else {
      setFormPrecioCompraNIO('');
    }
  };

  const handleCompraNIOChange = (valStr: string) => {
    setFormPrecioCompraNIO(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0 && tasaCambio > 0) {
      setFormPrecioCompraUSD((val / tasaCambio).toFixed(2));
    } else {
      setFormPrecioCompraUSD('');
    }
  };

  // Sincronizar precios de venta
  const handleVentaUSDChange = (valStr: string) => {
    setFormPrecioVentaUSD(valStr);
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setFormPrecioVentaNIO((val * tasaCambio).toFixed(2));
    } else {
      setFormPrecioVentaNIO('');
    }
  };

  const handleVentaNIOChange = (valStr: string) => {
    setFormPrecioVentaNIO(valStr);
    const val = parseFloat(valStr);
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
    const matchText = p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                      p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
                      (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()));
    const matchCat = categoriaFiltro ? p.categoria === categoriaFiltro : true;
    return matchText && matchCat;
  });

  const abrirModalNuevo = () => {
    setProductoEditar(null);
    setFormCodigo(`P${String(productos.length + 1).padStart(3, '0')}`);
    setFormNombre('');
    setFormCategoria('Perfumes');
    setFormMarca('');
    setFormImagen('');
    setFormSinImagen(false);
    setFormExistencia(10);
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

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodigo.trim() || !formNombre.trim()) {
      setErrorMsg('El código y el nombre del producto son obligatorios.');
      return;
    }

    // Respetar opción de no llevar imagen o imagen asignada
    const imagenFinal = formSinImagen ? '' : formImagen.trim();

    const pCompUSD = parseFloat(formPrecioCompraUSD) || 0;
    const pCompNIO = parseFloat(formPrecioCompraNIO) || (pCompUSD * tasaCambio);
    const pVentUSD = parseFloat(formPrecioVentaUSD) || 0;
    const pVentNIO = parseFloat(formPrecioVentaNIO) || (pVentUSD * tasaCambio);

    onGuardarProducto({
      codigo: formCodigo.trim().toUpperCase(),
      producto: formNombre.trim(),
      categoria: formCategoria.trim() || 'General',
      marca: formMarca.trim() || undefined,
      imagen: imagenFinal,
      sinImagen: formSinImagen || !imagenFinal,
      existencia: Number(formExistencia) || 0,
      precioCompra: pCompUSD,
      precioCompraCordobas: pCompNIO,
      precioVenta: pVentUSD,
      precioVentaCordobas: pVentNIO
    });

    setModalAbierto(false);
    setToastMensaje(formSinImagen ? 'Producto guardado sin imagen.' : 'Producto guardado con éxito.');
    setTimeout(() => setToastMensaje(null), 3000);
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
                      <div className="font-bold text-slate-900">{prod.producto}</div>
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

      {/* Modal Agregar / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">
                {productoEditar ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardar} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  value={formCodigo}
                  disabled={!!productoEditar}
                  onChange={e => setFormCodigo(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono uppercase bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Producto / Fragancia *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={e => {
                    setFormNombre(e.target.value);
                    if (!formImagen && formMarca && !formSinImagen) {
                      setFormImagen(obtenerImagenSugerida(formMarca, e.target.value));
                    }
                  }}
                  placeholder="Ej: Good Girl, Sauvage, Bombshell, 1 Million..."
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Opción destacada: Quitar imagen o no llevar imágenes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input 
                    type="checkbox"
                    checked={formSinImagen}
                    onChange={e => {
                      const check = e.target.checked;
                      setFormSinImagen(check);
                      if (check) {
                        setFormImagen('');
                        setMostrarSelectorImagenes(false);
                      }
                    }}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">
                      No llevar imagen (Guardar sin foto)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      El producto se mostrará con un icono genérico en el catálogo y POS
                    </span>
                  </div>
                </label>
                {formImagen && !formSinImagen && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormImagen('');
                      setFormSinImagen(true);
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shrink-0"
                  >
                    <ImageOff className="w-3.5 h-3.5" />
                    <span>Quitar foto actual</span>
                  </button>
                )}
              </div>

              {/* Marca del Perfume y Búsqueda Automática de Imagen (Solo si NO está en modo sin imagen) */}
              {!formSinImagen ? (
                <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-pink-900 text-xs">
                      Marca del Perfume
                    </label>
                    <button
                      type="button"
                      onClick={() => handleBuscarImagenPorMarca()}
                      className="text-[11px] font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-pink-200 shadow-2xs hover:bg-pink-100 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      <span>Buscar Imagen por Marca</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      list="marcas-perfumes"
                      value={formMarca}
                      onChange={e => seleccionarMarca(e.target.value)}
                      placeholder="Ej: Carolina Herrera, Dior, Chanel, Versace..."
                      className="flex-1 p-2 bg-white border border-pink-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <datalist id="marcas-perfumes">
                      {MARCAS_PERFUMES_POPULARES.map(m => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  {/* Previsualizador de la imagen asignada */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border-2 border-pink-300 shadow-xs shrink-0 flex items-center justify-center">
                      {formImagen ? (
                        <img 
                          src={formImagen} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={() => setFormImagen('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=200&q=80')}
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-pink-300" />
                      )}
                    </div>

                    <div className="flex-1 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-800 block">
                        {formImagen ? 'Imagen vinculada según marca' : 'Sin imagen específica'}
                      </span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 break-all">
                        {formImagen || 'Se asignará automáticamente según la marca elegida'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => handleBuscarImagenPorMarca()}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Ver otras imágenes de esta marca
                        </button>
                        {formImagen && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormImagen('');
                              setFormSinImagen(true);
                            }}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Galería desplegable de imágenes por marca */}
                  {mostrarSelectorImagenes && imagenesEncontradas.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-pink-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-pink-900 uppercase">
                          Elige una imagen para {formMarca || 'este perfume'}:
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarSelectorImagenes(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-700"
                        >
                          Cerrar galería
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {imagenesEncontradas.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormImagen(img.url);
                              setMostrarSelectorImagenes(false);
                            }}
                            className={`group relative rounded-lg overflow-hidden border-2 transition ${
                              formImagen === img.url 
                                ? 'border-pink-600 ring-2 ring-pink-400 shadow-md scale-105' 
                                : 'border-slate-200 hover:border-pink-400'
                            }`}
                            title={img.nombre}
                          >
                            <img 
                              src={img.url} 
                              alt={img.nombre} 
                              className="w-full h-12 object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold p-0.5 text-center leading-tight transition">
                              Elegir
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <ImageOff className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-amber-800">
                    <span className="font-bold block">Producto en modo sin foto</span>
                    <span className="text-[11px] text-amber-700">Se guardará sin cargar ninguna imagen para agilizar el sistema.</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={formCategoria}
                  onChange={e => setFormCategoria(e.target.value)}
                  placeholder="Ej: Perfumes, Cremas, Bolsos, Toallas Húmedas, Calzado, Ropa, Carteras"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">Existencia (Stock)</label>
                  <input
                    type="number"
                    min="0"
                    value={formExistencia}
                    onChange={e => setFormExistencia(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Indicador de Tasa en Modal */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold">Tasa Oficial:</span>
                  <span className="font-mono font-black">1 $ = C$ {tasaCambio.toFixed(2)}</span>
                </div>
                {onAbrirModalTasa && (
                  <button
                    type="button"
                    onClick={onAbrirModalTasa}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 underline font-bold"
                  >
                    Cambiar Tasa
                  </button>
                )}
              </div>

              {/* SELECTOR DE MONEDA PARA PRECIOS DEL PRODUCTO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleccionar Moneda para Fijar Precios del Producto:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setMonedaPrecios('NIO')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaPrecios === 'NIO'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>C$ Córdobas (NIO)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonedaPrecios('USD')}
                    className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      monedaPrecios === 'USD'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-white/50'
                    }`}
                  >
                    <span>$ Dólares (USD)</span>
                  </button>
                </div>
              </div>

              {/* PRECIO DE COMPRA MULTIMONEDA */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Precio de Compra (Costo Unitario) *
                  </label>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                    Conversión automática
                  </span>
                </div>

                {monedaPrecios === 'NIO' ? (
                  /* ENTRADA PRINCIPAL COMPRA: CÓRDOBAS */
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 mb-0.5">
                        Precio de Compra en Córdobas (C$ NIO) - Principal
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={formPrecioCompraNIO}
                          onChange={e => handleCompraNIOChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-2 py-2 bg-white border-2 border-emerald-500 rounded-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 text-sm shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500">Equivalente en Dólares ($):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPrecioCompraUSD}
                          onChange={e => handleCompraUSDChange(e.target.value)}
                          className="w-20 text-right p-0.5 font-bold outline-none text-blue-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ENTRADA PRINCIPAL COMPRA: DÓLARES */
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-blue-800 mb-0.5">
                        Precio de Compra en Dólares ($ USD) - Principal
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPrecioCompraUSD}
                          onChange={e => handleCompraUSDChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-2 py-2 bg-white border-2 border-blue-500 rounded-lg font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500">Equivalente en Córdobas (C$):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>C$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={formPrecioCompraNIO}
                          onChange={e => handleCompraNIOChange(e.target.value)}
                          className="w-24 text-right p-0.5 font-bold outline-none text-emerald-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PRECIO DE VENTA MULTIMONEDA */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-blue-900 text-xs">
                    Precio de Venta al Público *
                  </label>
                  {parseFloat(formPrecioVentaUSD) > parseFloat(formPrecioCompraUSD) && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Margen: {formatoUSD(parseFloat(formPrecioVentaUSD) - (parseFloat(formPrecioCompraUSD) || 0))} / {formatoNIO(parseFloat(formPrecioVentaNIO) - (parseFloat(formPrecioCompraNIO) || 0))}
                    </span>
                  )}
                </div>

                {monedaPrecios === 'NIO' ? (
                  /* ENTRADA PRINCIPAL VENTA: CÓRDOBAS */
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-800 mb-0.5">
                        Precio de Venta en Córdobas (C$ NIO) - Principal
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-xs">C$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={formPrecioVentaNIO}
                          onChange={e => handleVentaNIOChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-8 pr-2 py-2 bg-white border-2 border-emerald-500 rounded-lg font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-400 text-base shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500">Equivalente en Dólares ($):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPrecioVentaUSD}
                          onChange={e => handleVentaUSDChange(e.target.value)}
                          className="w-20 text-right p-0.5 font-bold outline-none text-blue-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ENTRADA PRINCIPAL VENTA: DÓLARES */
                  <div className="space-y-1.5">
                    <div>
                      <span className="block text-[10px] font-bold text-blue-800 mb-0.5">
                        Precio de Venta en Dólares ($ USD) - Principal
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-black text-blue-600 text-xs">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPrecioVentaUSD}
                          onChange={e => handleVentaUSDChange(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-2 py-2 bg-white border-2 border-blue-500 rounded-lg font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-400 text-base shadow-2xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs">
                      <span className="text-[11px] text-slate-500">Equivalente en Córdobas (C$):</span>
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <span>C$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={formPrecioVentaNIO}
                          onChange={e => handleVentaNIOChange(e.target.value)}
                          className="w-24 text-right p-0.5 font-bold outline-none text-emerald-700 bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {productoEditar ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalAbierto(false);
                      confirmarEliminar(productoEditar);
                    }}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Producto</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

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
