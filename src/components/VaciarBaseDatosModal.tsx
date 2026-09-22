import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  Download, 
  ShieldAlert, 
  CheckCircle2,
  Database,
  RotateCcw
} from 'lucide-react';

export type ModoLimpieza = 'todo' | 'transacciones' | 'productos';

interface VaciarBaseDatosModalProps {
  onClose: () => void;
  onConfirmar: (modo: ModoLimpieza) => void;
  onDescargarRespaldo: () => void;
  totalProductos: number;
  totalVentas: number;
  totalCreditos: number;
}

export const VaciarBaseDatosModal: React.FC<VaciarBaseDatosModalProps> = ({
  onClose,
  onConfirmar,
  onDescargarRespaldo,
  totalProductos,
  totalVentas,
  totalCreditos
}) => {
  const [modo, setModo] = useState<ModoLimpieza>('todo');
  const [confirmadoCheck, setConfirmadoCheck] = useState(false);
  const [descargoCopia, setDescargoCopia] = useState(false);

  const handleDescargarCopia = () => {
    onDescargarRespaldo();
    setDescargoCopia(true);
  };

  const handleEjecutar = () => {
    if (!confirmadoCheck) return;
    onConfirmar(modo);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-rose-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera de Peligro */}
        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">
                Vaciar Base de Datos
              </h2>
              <p className="text-xs text-rose-700">
                Zona de reinicio y eliminación permanente de registros
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

        {/* Contenido */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Advertencia */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-950">¡Atención! Esta acción no se puede deshacer.</p>
              <p>
                Actualmente su sistema tiene <strong>{totalProductos} productos</strong>, <strong>{totalVentas} ventas registradas</strong> y <strong>{totalCreditos} créditos</strong>.
              </p>
            </div>
          </div>

          {/* Recomendación de Copia de Seguridad */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-800">Copia de Seguridad preventiva:</p>
              <p className="text-slate-500 text-[11px]">
                Descargue un archivo Excel con todos sus datos antes de eliminarlos.
              </p>
            </div>
            <button
              onClick={handleDescargarCopia}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                descargoCopia 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {descargoCopia ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              <span>{descargoCopia ? '¡Descargado!' : 'Descargar Excel'}</span>
            </button>
          </div>

          {/* Opciones de Eliminación */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Seleccione qué datos desea eliminar:
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setModo('todo')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                  modo === 'todo'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-950 ring-1 ring-rose-400'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="modo_limpieza"
                  checked={modo === 'todo'}
                  onChange={() => setModo('todo')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <p className="font-bold">Vaciar TODO por completo (Reset de Fábrica)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Borra productos, clientes, proveedores, ventas, créditos, abonos, compras y caja chica. El sistema quedará en blanco como recién instalado.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setModo('transacciones')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                  modo === 'transacciones'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 ring-1 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="modo_limpieza"
                  checked={modo === 'transacciones'}
                  onChange={() => setModo('transacciones')}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <p className="font-bold">Vaciar solo Transacciones (Ventas, Créditos y Caja)</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <strong>Conserva</strong> su catálogo de productos y lista de clientes/proveedores, pero reinicia a cero el historial de ventas, créditos y saldo de caja.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setModo('productos')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                  modo === 'productos'
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-400'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="modo_limpieza"
                  checked={modo === 'productos'}
                  onChange={() => setModo('productos')}
                  className="mt-0.5 text-indigo-600"
                />
                <div>
                  <p className="font-bold">Vaciar solo Catálogo de Productos</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Elimina todos los artículos del inventario para cargar una nueva lista de Excel desde cero.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Casilla de confirmación obligatoria */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmadoCheck}
                onChange={(e) => setConfirmadoCheck(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span>Entiendo que los datos seleccionados se eliminarán definitivamente</span>
            </label>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            Cancelar
          </button>

          <button
            disabled={!confirmadoCheck}
            onClick={handleEjecutar}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs ${
              confirmadoCheck
                ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar y Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
