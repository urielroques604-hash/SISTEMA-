import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  ArrowRight,
  Database,
  Users,
  Package,
  Truck,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  procesarArchivoExcel, 
  ResultadoImportacionExcel,
  descargarPlantillaProductosExcel,
  descargarPlantillaClientesExcel
} from '../utils/importExcel';
import { Producto, Cliente, Proveedor } from '../types';

interface ImportarExcelModalProps {
  onClose: () => void;
  onImportarTodo?: (datos: {
    productos: Producto[];
    clientes: Cliente[];
    proveedores: Proveedor[];
  }, modo: 'fusionar' | 'reemplazar') => void;
  onImportarProductos?: (productos: Producto[], modo: 'fusionar' | 'reemplazar') => void;
  onImportarClientes?: (clientes: Cliente[], modo: 'fusionar' | 'reemplazar') => void;
  onImportarProveedores?: (proveedores: Proveedor[], modo: 'fusionar' | 'reemplazar') => void;
  onImportarSistemaCompleto?: (datos: {
    productos?: Producto[];
    clientes?: Cliente[];
    proveedores?: Proveedor[];
  }, modo: 'fusionar' | 'reemplazar') => void;
}

export const ImportarExcelModal: React.FC<ImportarExcelModalProps> = ({
  onClose,
  onImportarTodo,
  onImportarProductos,
  onImportarClientes,
  onImportarProveedores,
  onImportarSistemaCompleto
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacionExcel | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modo, setModo] = useState<'fusionar' | 'reemplazar'>('fusionar');
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivo = async (file: File) => {
    setErrorMsg(null);
    setResultado(null);
    setCargando(true);
    setArchivo(file);

    try {
      const res = await procesarArchivoExcel(file);
      setCargando(false);
      if (res.success) {
        setResultado(res);
      } else {
        setErrorMsg(res.mensaje);
      }
    } catch (err) {
      setCargando(false);
      setErrorMsg('Error al analizar archivo: ' + (err as Error).message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const handleDragLeave = () => {
    setArrastrando(false);
  };

  const ejecutarImportacion = () => {
    if (!resultado) return;

    if (onImportarTodo) {
      onImportarTodo({
        productos: resultado.productos,
        clientes: resultado.clientes,
        proveedores: resultado.proveedores
      }, modo);
      onClose();
      return;
    }

    if (onImportarSistemaCompleto) {
      onImportarSistemaCompleto({
        productos: resultado.productos,
        clientes: resultado.clientes,
        proveedores: resultado.proveedores
      }, modo);
      onClose();
      return;
    }

    // Fallbacks
    if (resultado.productos.length > 0 && onImportarProductos) {
      onImportarProductos(resultado.productos, modo);
    }
    if (resultado.clientes.length > 0 && onImportarClientes) {
      onImportarClientes(resultado.clientes, modo);
    }
    if (resultado.proveedores.length > 0 && onImportarProveedores) {
      onImportarProveedores(resultado.proveedores, modo);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Importación Automática de Excel
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <Sparkles className="w-3 h-3" /> Todas las hojas
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detecta y extrae automáticamente todas las hojas del libro sin necesidad de seleccionarlas
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Zona de Arrastrar y Soltar Archivo */}
          {!resultado && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                arrastrando 
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                {cargando ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {cargando ? 'Leyendo todas las hojas del Excel...' : 'Arrastre su archivo Excel aquí o haga clic para seleccionar'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se importarán <strong>todas las hojas y pestañas</strong> que contenga el archivo en una sola operación.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-400">¿Desea una plantilla prediseñada?</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    descargarPlantillaProductosExcel();
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 underline underline-offset-2"
                >
                  <Download className="w-3 h-3" /> Descargar Plantilla Productos
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    descargarPlantillaClientesExcel();
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 underline underline-offset-2"
                >
                  <Download className="w-3 h-3" /> Plantilla Clientes
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No se pudo procesar el archivo:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Vista consolidada de TODAS las hojas encontradas */}
          {resultado && (
            <div className="space-y-4">
              {/* Notificación de Éxito de Escaneo Automático */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Archivo: <span className="underline">{archivo?.name}</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      ✨ <strong>{resultado.nombresHojas.length} {resultado.nombresHojas.length === 1 ? 'hoja leída' : 'hojas leídas e integradas simultáneamente'}</strong>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setResultado(null);
                    setArchivo(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold px-2 py-1"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Lista Desglosada de Hojas Reconocidas */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Hojas leídas del archivo ({resultado.nombresHojas.length}):</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Todas se importarán a la vez
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {resultado.hojasDetalle.map((h, i) => (
                    <div 
                      key={i} 
                      className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                        h.tipo === 'vacia' 
                          ? 'bg-slate-100 border-slate-200 text-slate-400'
                          : h.tipo === 'productos'
                          ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                          : h.tipo === 'clientes'
                          ? 'bg-purple-50 border-purple-200 text-purple-800 font-medium'
                          : 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
                      }`}
                    >
                      <span className="font-bold">📄 {h.nombre}:</span>
                      <span>{h.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Total de Entidades a Importar */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
                  <Package className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                  <p className="text-lg font-black text-blue-900">{resultado.productos.length}</p>
                  <p className="text-[11px] font-semibold text-blue-700">Prendas / Productos</p>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 text-center">
                  <Users className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-black text-purple-900">{resultado.clientes.length}</p>
                  <p className="text-[11px] font-semibold text-purple-700">Clientes</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
                  <Truck className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <p className="text-lg font-black text-amber-900">{resultado.proveedores.length}</p>
                  <p className="text-[11px] font-semibold text-amber-700">Proveedores</p>
                </div>
              </div>

              {/* Modo de importación */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <label className="block text-slate-700 font-bold mb-1.5">
                  ¿Cómo desea incorporar estos datos al sistema?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    modo === 'fusionar' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="modoImportacion"
                      checked={modo === 'fusionar'}
                      onChange={() => setModo('fusionar')}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">➕ Fusionar y Actualizar</span>
                      <span className="text-[11px] text-slate-500">Mantiene lo que ya tiene guardado y agrega los nuevos registros del archivo.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                    modo === 'reemplazar' ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="modoImportacion"
                      checked={modo === 'reemplazar'}
                      onChange={() => setModo('reemplazar')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">🔄 Reemplazar Catálogo</span>
                      <span className="text-[11px] text-slate-500">Borra los productos/fragancias anteriores y deja exactamente los importados desde el Excel.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Vista previa de las primeras filas */}
              {resultado.previewFilas && resultado.previewFilas.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Vista previa de los primeros registros a incorporar:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total: <strong>{resultado.filasTotales}</strong> registros
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-44">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                          <th className="p-2">Código / ID</th>
                          <th className="p-2">Descripción / Nombre</th>
                          <th className="p-2">Categoría / Tipo</th>
                          <th className="p-2 text-right">Existencia / Tel</th>
                          <th className="p-2 text-right">PVP / Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                        {resultado.previewFilas.map((fila: any, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="p-2 font-bold text-blue-600">
                              {fila.codigo || fila.id || `REG-${i+1}`}
                            </td>
                            <td className="p-2 font-sans text-slate-800">
                              {fila.producto || fila.nombre || '-'}
                            </td>
                            <td className="p-2 font-sans text-slate-500">
                              {fila.categoria || (fila.telefono ? 'Cliente' : 'General')}
                            </td>
                            <td className="p-2 text-right font-bold">
                              {fila.existencia !== undefined ? fila.existencia : (fila.telefono || '-')}
                            </td>
                            <td className="p-2 text-right font-bold text-emerald-600">
                              {fila.precioVenta !== undefined ? `$${fila.precioVenta.toFixed(2)}` : (fila.direccion || '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Barra de Acciones / Pie */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            Cancelar
          </button>

          <button
            disabled={!resultado || resultado.filasTotales === 0}
            onClick={ejecutarImportacion}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs ${
              resultado && resultado.filasTotales > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {resultado 
                ? `Importar Todas las Hojas (${resultado.filasTotales} registros)` 
                : 'Importar Todo'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
