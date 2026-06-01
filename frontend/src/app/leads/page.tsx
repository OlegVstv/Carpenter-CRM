'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Lead } from '@/types';
import { Trash2, UserPlus, X, RefreshCw } from 'lucide-react';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('звонок');
  const [status, setStatus] = useState('новый запрос');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLeadsData = () => {
    setLoading(true);
    api.getLeads()
      .then((data) => {
        setLeads(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки лидов');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phone) {
      setFormError('Укажите имя клиента и телефон');
      return;
    }
    setFormError(null);

    api.createLead({
      client_name: clientName,
      phone,
      source,
      status,
    })
      .then(() => {
        setIsModalOpen(false);
        setClientName('');
        setPhone('');
        setSource('звонок');
        setStatus('новый запрос');
        fetchLeadsData();
      })
      .catch((err) => {
        setFormError(err.message || 'Ошибка создания лида');
      });
  };

  const handleDeleteLead = (id: number) => {
    if (!confirm('Вы действительно хотите удалить этот лид?')) return;
    api.deleteLead(id)
      .then(() => {
        fetchLeadsData();
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
      case 'отказ':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Лиды (Входящие запросы)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Список входящих запросов от потенциальных клиентов столярной мастерской.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeadsData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition shadow-sm"
            title="Обновить"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
          >
            <UserPlus className="w-5 h-5" />
            <span>Добавить лид</span>
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
      ) : leads.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <p className="text-slate-400 text-sm font-medium">Список входящих лидов пуст</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
          >
            Создать первый лид
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Клиент</th>
                  <th className="px-6 py-4">Телефон</th>
                  <th className="px-6 py-4">Источник</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Дата создания</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {leads.map((lead) => {
                  const dateStr = new Date(lead.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4 text-slate-400 font-bold">#{lead.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{lead.client_name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded border border-slate-200/50">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{dateStr}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить лид"
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

      {/* Modal for creating a Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Создание нового лида</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Имя клиента</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Например: Иван Иванов"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Телефон</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Источник</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="звонок">звонок</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="сайт">сайт</option>
                    <option value="рекомендация">рекомендация</option>
                    <option value="повторный клиент">повторный клиент</option>
                    <option value="реклама">реклама</option>
                    <option value="вручную внесено">вручную внесено</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Статус</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="новый запрос">новый запрос</option>
                    <option value="просчет / КП">просчет / КП</option>
                    <option value="КП отправлено">КП отправлено</option>
                    <option value="согласование">согласование</option>
                    <option value="отказ">отказ</option>
                  </select>
                </div>
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
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
