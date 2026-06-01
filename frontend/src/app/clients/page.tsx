'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Client, Lead } from '@/types';
import { Trash2, UserCheck, X, RefreshCw } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [unconvertedLeads, setUnconvertedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [leadId, setLeadId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchClientsData = () => {
    setLoading(true);
    Promise.all([
      api.getClients().catch(() => []),
      api.getLeads().catch(() => []),
    ])
      .then(([clientsData, leadsData]) => {
        setClients(clientsData);
        // Filter out leads that have already been converted into clients
        const convertedLeadIds = clientsData.map(c => c.lead_id).filter(Boolean);
        const unconverted = leadsData.filter(l => !convertedLeadIds.includes(l.id) && l.status !== 'отказ');
        setUnconvertedLeads(unconverted);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки данных');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClientsData();
  }, []);

  const handleConvertLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) {
      setFormError('Выберите лид для конвертации');
      return;
    }
    setFormError(null);

    api.createClientFromLead({
      lead_id: parseInt(leadId),
      email: email || null,
      address: address || null,
      comment: comment || null,
    })
      .then(() => {
        setIsModalOpen(false);
        setLeadId('');
        setEmail('');
        setAddress('');
        setComment('');
        fetchClientsData();
      })
      .catch((err) => {
        setFormError(err.message || 'Ошибка конвертации лида');
      });
  };

  const handleDeleteClient = (id: number) => {
    if (!confirm('Вы действительно хотите удалить этого клиента из базы?')) return;
    api.deleteClient(id)
      .then(() => {
        fetchClientsData();
      })
      .catch((err) => {
        alert('Ошибка удаления: ' + err.message);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'новый запрос':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'просчет / КП':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'КП отправлено':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'согласование':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'предоплата':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'передан в производство':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'оплачен полностью':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'закрыт':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'отказ':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'архив':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Постоянные клиенты</h1>
          <p className="text-sm text-slate-500 mt-1">
            База подтвержденных клиентов столярной мастерской, созданная путем конвертации лидов.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchClientsData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition shadow-sm"
            title="Обновить"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
          >
            <UserCheck className="w-5 h-5" />
            <span>Конвертировать лид</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-50 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-center">
          <p className="text-sm text-rose-800 font-medium">{error}</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <p className="text-slate-400 text-sm font-medium">Список клиентов пуст</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
          >
            Конвертировать первый лид
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Имя клиента</th>
                  <th className="px-6 py-4">Телефон</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Источник</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Из лида</th>
                  <th className="px-6 py-4">Создан</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {clients.map((client) => {
                  const dateStr = new Date(client.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={client.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4 text-slate-400 font-bold">#{client.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{client.name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{client.phone}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">{client.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded border border-slate-200/50">
                          {client.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusBadge(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold text-xs">
                        {client.lead_id ? `#${client.lead_id}` : 'вручную'}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{dateStr}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить клиента"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for converting a Lead into a Client */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Конвертация лида в клиента</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            {unconvertedLeads.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs text-center font-medium">
                Нет доступных лидов для конвертации. Создайте сначала нового лида.
              </div>
            ) : (
              <form onSubmit={handleConvertLead} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выберите лид</label>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- Выбрать из списка --</option>
                    {unconvertedLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.client_name} ({l.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="example@mail.ru"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Адрес объекта</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="Например: ул. Ленина, д. 10, кв. 5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Комментарий</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold resize-none"
                    placeholder="Особые отметки, пожелания..."
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
                  >
                    Конвертировать
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
