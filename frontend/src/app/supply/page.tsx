'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { SupplyRequest, Material, Supplier, Order } from '@/types';
import {
  Trash2,
  Plus,
  RefreshCw,
  Truck,
  Package,
  BookOpen,
  X,
  PlusCircle,
} from 'lucide-react';

type TabType = 'requests' | 'materials' | 'suppliers';

export default function SupplyPage() {
  const [tab, setTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Form: New Supply Request
  const [reqOrder, setReqOrder] = useState('');
  const [reqMaterial, setReqMaterial] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [reqPrice, setReqPrice] = useState('');
  const [reqStatus, setReqStatus] = useState('черновик');
  const [reqDelivery, setReqDelivery] = useState('');
  const [reqFormError, setReqFormError] = useState<string | null>(null);

  // Form: New Material
  const [matName, setMatName] = useState('');
  const [matSku, setMatSku] = useState('');
  const [matUnit, setMatUnit] = useState('шт');
  const [matPrice, setMatPrice] = useState('');
  const [matFormError, setMatFormError] = useState<string | null>(null);

  // Form: New Supplier
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supFormError, setSupFormError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getSupplyRequests().catch(() => []),
      api.getMaterials().catch(() => []),
      api.getSuppliers().catch(() => []),
      api.getOrders().catch(() => []),
    ])
      .then(([reqs, mats, sups, ords]) => {
        setRequests(reqs);
        setMaterials(mats);
        setSuppliers(sups);
        setOrders(ords);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки данных');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Supply Request Actions
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqOrder || !reqMaterial || !reqQty || !reqPrice) {
      setReqFormError('Заполните обязательные поля: заказ, материал, количество и цену');
      return;
    }
    setReqFormError(null);

    api.createSupplyRequest({
      order_id: parseInt(reqOrder),
      material_id: parseInt(reqMaterial),
      quantity: parseFloat(reqQty),
      actual_price: parseFloat(reqPrice),
      status: reqStatus,
      delivery_date: reqDelivery || null,
    })
      .then(() => {
        setIsRequestModalOpen(false);
        setReqOrder('');
        setReqMaterial('');
        setReqQty('');
        setReqPrice('');
        setReqStatus('черновик');
        setReqDelivery('');
        fetchData();
      })
      .catch((err) => {
        setReqFormError(err.message || 'Ошибка создания заявки');
      });
  };

  const handleUpdateStatus = (id: number, status: string, deliveryDate?: string | null) => {
    api.updateSupplyRequestStatus(id, status, deliveryDate)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка изменения статуса: ' + err.message);
      });
  };

  const handleDeleteRequest = (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту заявку на закупку?')) return;
    api.deleteSupplyRequest(id)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка удаления: ' + err.message);
      });
  };

  // Material Actions
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName || !matUnit || !matPrice) {
      setMatFormError('Заполните обязательные поля: наименование, ед. измерения и цену');
      return;
    }
    setMatFormError(null);

    api.createMaterial({
      name: matName,
      sku: matSku || null,
      unit: matUnit,
      price: parseFloat(matPrice),
    })
      .then(() => {
        setIsMaterialModalOpen(false);
        setMatName('');
        setMatSku('');
        setMatUnit('шт');
        setMatPrice('');
        fetchData();
      })
      .catch((err) => {
        setMatFormError(err.message || 'Ошибка добавления материала');
      });
  };

  // Supplier Actions
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) {
      setSupFormError('Введите наименование поставщика');
      return;
    }
    setSupFormError(null);

    api.createSupplier({
      name: supName,
      contact_person: supContact || null,
      phone: supPhone || null,
      email: supEmail || null,
    })
      .then(() => {
        setIsSupplierModalOpen(false);
        setSupName('');
        setSupContact('');
        setSupPhone('');
        setSupEmail('');
        fetchData();
      })
      .catch((err) => {
        setSupFormError(err.message || 'Ошибка добавления поставщика');
      });
  };

  const getSupplyStatusColor = (status: string) => {
    switch (status) {
      case 'черновик': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'согласовано': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'заказано': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'получено': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'отменено': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const SUPPLY_STATUSES = ['черновик', 'согласовано', 'заказано', 'получено', 'отменено'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Снабжение и закупки</h1>
          <p className="text-sm text-slate-500 mt-1">
            Заявки на закупку сырья и комплектующих под заказы, каталог материалов и база поставщиков.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition shadow-sm"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {tab === 'requests' && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
            >
              <Truck className="w-5 h-5" />
              <span>Создать заявку</span>
            </button>
          )}
          {tab === 'materials' && (
            <button
              onClick={() => setIsMaterialModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
            >
              <Package className="w-5 h-5" />
              <span>Новый материал</span>
            </button>
          )}
          {tab === 'suppliers' && (
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
            >
              <BookOpen className="w-5 h-5" />
              <span>Новый поставщик</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            tab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Заявки на закупку
        </button>
        <button
          onClick={() => setTab('materials')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            tab === 'materials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Каталог материалов
        </button>
        <button
          onClick={() => setTab('suppliers')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            tab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Справочник поставщиков
        </button>
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
      ) : tab === 'requests' ? (
        /* Tab: Requests */
        requests.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Заявок на закупку материалов пока нет</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Заказ / Изделие</th>
                    <th className="px-6 py-4">Клиент</th>
                    <th className="px-6 py-4">Материал</th>
                    <th className="px-6 py-4">Количество</th>
                    <th className="px-6 py-4">Цена / ед</th>
                    <th className="px-6 py-4">Сумма закупки</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Дата доставки</th>
                    <th className="px-6 py-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {requests.map(req => {
                    const totalCost = req.quantity * req.actual_price;
                    const dateStr = req.delivery_date ? new Date(req.delivery_date).toLocaleDateString('ru-RU') : '—';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-6 py-4 text-slate-400 font-bold">#{req.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          #{req.order_id} — {req.order_product_type}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{req.client_name || '—'}</td>
                        <td className="px-6 py-4 font-bold text-blue-600">{req.material_name}</td>
                        <td className="px-6 py-4 font-semibold">{req.quantity}</td>
                        <td className="px-6 py-4 font-semibold">{req.actual_price.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{totalCost.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-6 py-4">
                          <select
                            value={req.status}
                            onChange={(e) => handleUpdateStatus(req.id, e.target.value, req.delivery_date)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md border focus:outline-none cursor-pointer ${getSupplyStatusColor(req.status)}`}
                          >
                            {SUPPLY_STATUSES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{dateStr}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Удалить заявку"
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
        )
      ) : tab === 'materials' ? (
        /* Tab: Materials */
        materials.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Справочник материалов пуст</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Наименование</th>
                    <th className="px-6 py-4">Артикул / SKU</th>
                    <th className="px-6 py-4">Ед. измерения</th>
                    <th className="px-6 py-4">Базовая цена</th>
                    <th className="px-6 py-4">Дата добавления</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {materials.map(mat => {
                    const dateStr = new Date(mat.created_at).toLocaleDateString('ru-RU');

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-6 py-4 text-slate-400 font-bold">#{mat.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{mat.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{mat.sku || '—'}</td>
                        <td className="px-6 py-4 text-slate-700">{mat.unit}</td>
                        <td className="px-6 py-4 font-bold">{mat.price.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{dateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Tab: Suppliers */
        suppliers.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
            <p className="text-slate-400 text-sm font-medium">Справочник поставщиков пуст</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Поставщик / Компания</th>
                    <th className="px-6 py-4">Контактное лицо</th>
                    <th className="px-6 py-4">Телефон</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Создан</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {suppliers.map(sup => {
                    const dateStr = new Date(sup.created_at).toLocaleDateString('ru-RU');

                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/30 transition">
                        <td className="px-6 py-4 text-slate-400 font-bold">#{sup.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{sup.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{sup.contact_person || '—'}</td>
                        <td className="px-6 py-4 text-slate-700">{sup.phone || '—'}</td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-xs">{sup.email || '—'}</td>
                        <td className="px-6 py-4 text-slate-400 text-xs font-semibold">{dateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal: New Supply Request */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Создание заявки на закупку</h3>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {reqFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {reqFormError}
              </div>
            )}

            {orders.length === 0 || materials.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">Создайте сначала активные заказы и каталог материалов.</p>
            ) : (
              <form onSubmit={handleCreateRequest} className="space-y-4 text-sm font-medium">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Связать с заказом</label>
                  <select
                    value={reqOrder}
                    onChange={(e) => setReqOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- Выберите заказ --</option>
                    {orders.filter(o => !['сдан клиенту', 'закрыт', 'отказ'].includes(o.status)).map(o => (
                      <option key={o.id} value={o.id}>#{o.id} — {o.product_type} ({o.client_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выбрать материал</label>
                  <select
                    value={reqMaterial}
                    onChange={(e) => {
                      setReqMaterial(e.target.value);
                      const selectedMat = materials.find(m => m.id === parseInt(e.target.value));
                      if (selectedMat) setReqPrice(selectedMat.price.toString());
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- Выберите материал --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.price} ₽ / {m.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Количество</label>
                    <input
                      type="number"
                      step="any"
                      value={reqQty}
                      onChange={(e) => setReqQty(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Фактическая цена / ед</label>
                    <input
                      type="number"
                      value={reqPrice}
                      onChange={(e) => setReqPrice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Начальный статус</label>
                    <select
                      value={reqStatus}
                      onChange={(e) => setReqStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      {SUPPLY_STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Планируемый срок</label>
                    <input
                      type="date"
                      value={reqDelivery}
                      onChange={(e) => setReqDelivery(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                  >
                    Оформить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Material */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Добавление нового материала</h3>
              <button onClick={() => setIsMaterialModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {matFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {matFormError}
              </div>
            )}

            <form onSubmit={handleCreateMaterial} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Наименование материала</label>
                <input
                  type="text"
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Например: Лак полиуретановый бесцветный"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Артикул / SKU (опц.)</label>
                <input
                  type="text"
                  value={matSku}
                  onChange={(e) => setMatSku(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="LU-1092"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ед. измерения</label>
                  <select
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="шт">шт (штука)</option>
                    <option value="м²">м² (кв. метр)</option>
                    <option value="м.п.">м.п. (пог. метр)</option>
                    <option value="литр">литр</option>
                    <option value="кг">кг (килограмм)</option>
                    <option value="куб.м">куб.м (кубометр)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ориентировочная цена</label>
                  <input
                    type="number"
                    value={matPrice}
                    onChange={(e) => setMatPrice(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Добавление поставщика</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {supFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {supFormError}
              </div>
            )}

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Название поставщика</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Например: ВудМаркет-ДВ"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Контактное лицо</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Константин"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Телефон</label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                    placeholder="+7..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                    placeholder="sales@wood.ru"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
