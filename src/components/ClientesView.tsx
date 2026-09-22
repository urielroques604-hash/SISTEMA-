import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Phone, MapPin, X, Check, Upload } from 'lucide-react';
import { Cliente } from '../types';

interface ClientesProps {
  clientes: Cliente[];
  onGuardarCliente: (cli: Cliente) => void;
  onImportarExcel?: () => void;
}

export const ClientesView: React.FC<ClientesProps> = ({
  clientes,
  onGuardarCliente,
  onImportarExcel
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.telefono.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirNuevo = () => {
    setClienteEditar(null);
    setNombre('');
    setTelefono('');
    setDireccion('');
    setObservaciones('');
    setModalAbierto(true);
  };

  const abrirEditar = (c: Cliente) => {
    setClienteEditar(c);
    setNombre(c.nombre);
    setTelefono(c.telefono);
    setDireccion(c.direccion);
    setObservaciones(c.observaciones);
    setModalAbierto(true);
  };

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const id = clienteEditar ? clienteEditar.id : `CLI-${String(clientes.length + 1).padStart(4, '0')}`;
    onGuardarCliente({
      id,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      observaciones: observaciones.trim()
    });

    setModalAbierto(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o ID..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onImportarExcel && (
            <button
              onClick={onImportarExcel}
              className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
              title="Importar clientes o catálogo desde Excel"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Importar Excel</span>
            </button>
          )}

          <button
            onClick={abrirNuevo}
            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Observaciones</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-700">{c.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{c.telefono || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.direccion || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.observaciones || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                {clienteEditar ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={guardar} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
