import React, { useState } from 'react';
import { Coins, Check, X, RefreshCw, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react';
import { formatoUSD, formatoNIO, TASA_CAMBIO_DEFAULT } from '../utils/currency';

interface ModalTasaCambioProps {
  tasaActual: number;
  onGuardarTasa: (nuevaTasa: number) => void;
  onClose: () => void;
}

export const ModalTasaCambio: React.FC<ModalTasaCambioProps> = ({
  tasaActual,
  onGuardarTasa,
  onClose
}) => {
  const [tasaInput, setTasaInput] = useState<string>(String(tasaActual));
  const [error, setError] = useState<string | null>(null);

  const tasaNumero = parseFloat(tasaInput) || 0;

  const presets = [36.62, 36.65, 36.70, 36.75, 37.00];

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (tasaNumero <= 0 || isNaN(tasaNumero)) {
      setError('La tasa de cambio debe ser un número mayor a 0 (ej: 36.65).');
      return;
    }
    onGuardarTasa(tasaNumero);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Coins className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Tasa de Cambio Oficial</h3>
              <p className="text-xs text-emerald-100">Dólar ($ USD) ⇄ Córdoba (C$ NIO)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleGuardar} className="p-5 space-y-4 text-xs">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Tasa Activa en el Sistema:</span>
                <span className="text-[11px] text-slate-600">Se aplica a compras, ventas, catálogo y tickets POS</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-sm text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-300">
                1 $ = C$ {tasaActual.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5 text-xs">
              Nueva Tasa de Cambio (Córdobas por 1 Dólar) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">
                1 $ = C$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={tasaInput}
                onChange={e => {
                  setError(null);
                  setTasaInput(e.target.value);
                }}
                className="w-full pl-20 pr-3 py-2.5 bg-white border-2 border-emerald-500 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Ej: 36.65"
                autoFocus
              />
            </div>
            {error && <p className="text-rose-600 font-semibold mt-1 text-[11px]">{error}</p>}
          </div>

          {/* Presets rápidos */}
          <div>
            <span className="block font-semibold text-slate-600 mb-1 text-[11px]">Valores rápidos frecuentes:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTasaInput(String(p));
                    setError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    tasaNumero === p
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  C$ {p.toFixed(2)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setTasaInput(String(TASA_CAMBIO_DEFAULT));
                  setError(null);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1"
                title="Restablecer valor base sugerido"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Base (36.65)</span>
              </button>
            </div>
          </div>

          {/* Tabla de equivalencias en tiempo real */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <span className="font-bold text-slate-700 block text-[11px]">
              Simulación de Precios con esta tasa (1 $ = C$ {tasaNumero > 0 ? tasaNumero.toFixed(2) : '0.00'}):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                <span className="text-slate-500">$5.00 USD</span>
                <span className="font-bold text-slate-900">C$ {(5 * tasaNumero).toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                <span className="text-slate-500">$10.00 USD</span>
                <span className="font-bold text-slate-900">C$ {(10 * tasaNumero).toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                <span className="text-slate-500">$25.00 USD</span>
                <span className="font-bold text-slate-900">C$ {(25 * tasaNumero).toFixed(2)}</span>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 flex justify-between">
                <span className="text-slate-500">$50.00 USD</span>
                <span className="font-bold text-slate-900">C$ {(50 * tasaNumero).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Tasa de Cambio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
