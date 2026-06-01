'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Order, SupplyRequest, Payment } from '@/types';
import {
  Trash2,
  Plus,
  RefreshCw,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [supplies, setSupplies] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses'>('sales');

  // Payments Modals & form state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentFormError, setPaymentFormError] = useState<string | null>(null);

  // Expanded payments history per order
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<number, boolean>>({});

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getOrders().catch(() => []),
      api.getSupplyRequests().catch(() => []),
    ])
      .then(([ordersData, suppliesData]) => {
        setOrders(ordersData);
        setSupplies(suppliesData);
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

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !paymentAmount) {
      setPaymentFormError('Укажите сумму платежа');
      return;
    }
    setPaymentFormError(null);

    api.createPayment({
      order_id: selectedOrderId,
      amount: parseFloat(paymentAmount),
      payment_date: paymentDate || null,
      comment: paymentComment || null,
    })
      .then(() => {
        setSelectedOrderId(null);
        setPaymentAmount('');
        setPaymentComment('');
        setPaymentDate('');
        fetchData();
      })
      .catch((err) => {
        setPaymentFormError(err.message || 'Ошибка внесения платежа');
      });
  };

  const handleDeletePayment = (paymentId: number) => {
    if (!confirm('Вы действительно хотите удалить этот платеж? Роль DIRECTOR обязательна.')) return;
    api.deletePayment(paymentId)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка удаления платежа: ' + err.message);
      });
  };

  const handleApproveSupply = (reqId: number, currentStatus: string, deliveryDate: string | null) => {
    api.updateSupplyRequestStatus(reqId, 'согласовано', deliveryDate)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка согласования закупки: ' + err.message);
      });
  };

  const toggleOrderExpansion = (orderId: number) => {
    setExpandedOrderIds(prev => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'ожидает оплаты':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'предоплата':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'оплачен полностью':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getSupplyStatusBadge = (status: string) => {
    switch (status) {
      case 'черновик': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'согласовано': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'заказано': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'получено': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'отменено': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Финансовый учет</h1>
          <p className="text-sm text-slate-500 mt-1">
            Контроль оплат по заказам (Доходы) и согласование закупок снабжения (Расходы).
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition shadow-sm"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'sales'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
          <span>Доходы и оплатные транзакции</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          <span>Расходы на снабжение</span>
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
      ) : activeTab === 'sales' ? (
        /* Tab: Sales / Incomes */
        orders.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Заказы не найдены.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4" style={{ width: '40px' }} />
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Клиент</th>
                    <th className="px-6 py-4">Изделие</th>
                    <th className="px-6 py-4">Стоимость заказа</th>
                    <th className="px-6 py-4">Оплачено</th>
                    <th className="px-6 py-4">Остаток (Долг)</th>
                    <th className="px-6 py-4">Статус оплаты</th>
                    <th className="px-6 py-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {orders.map(order => {
                    const isExpanded = !!expandedOrderIds[order.id];
                    const hasPayments = order.payments && order.payments.length > 0;

                    return (
                      <React.Fragment key={order.id}>
                        {/* Order Row */}
                        <tr className="hover:bg-slate-50/20 transition">
                          <td className="px-6 py-4">
                            {hasPayments ? (
                              <button
                                onClick={() => toggleOrderExpansion(order.id)}
                                className="text-slate-400 hover:text-slate-700 transition"
                              >
                                {isExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            ) : (
                              <span className="w-5 h-5 block" />
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-bold">#{order.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{order.client_name || `Клиент #${order.client_id}`}</td>
                          <td className="px-6 py-4 font-medium">{order.product_type}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{order.price.toLocaleString('ru-RU')} ₽</td>
                          <td className="px-6 py-4 font-bold text-emerald-600">{order.paid_amount.toLocaleString('ru-RU')} ₽</td>
                          <td className="px-6 py-4 font-bold text-rose-500">{order.remaining_balance.toLocaleString('ru-RU')} ₽</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${getPaymentStatusBadge(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedOrderId(order.id)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-lg transition"
                            >
                              Внести платеж
                            </button>
                          </td>
                        </tr>

                        {/* Payments Expansion Sub-Table */}
                        {isExpanded && hasPayments && (
                          <tr>
                            <td colSpan={9} className="bg-slate-50/60 px-8 py-4 border-l-4 border-blue-500">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">История транзакций по заказу #{order.id}</h4>
                                <table className="w-full text-xs text-slate-600 font-medium">
                                  <thead>
                                    <tr className="text-left text-slate-400 font-bold border-b border-slate-100 pb-2">
                                      <th className="pb-2">Сумма</th>
                                      <th className="pb-2">Дата получения</th>
                                      <th className="pb-2">Комментарий</th>
                                      <th className="pb-2 text-right">Удаление</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {order.payments.map(pay => {
                                      const payDateStr = pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('ru-RU') : '—';
                                      return (
                                        <tr key={pay.id} className="hover:bg-slate-100/50 transition">
                                          <td className="py-2.5 font-bold text-emerald-600">+{pay.amount.toLocaleString('ru-RU')} ₽</td>
                                          <td className="py-2.5 font-semibold text-slate-500">{payDateStr}</td>
                                          <td className="py-2.5 text-slate-600 font-semibold">{pay.comment || '—'}</td>
                                          <td className="py-2.5 text-right">
                                            <button
                                              onClick={() => handleDeletePayment(pay.id)}
                                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                              title="Удалить платеж"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Tab: Expenses / Supplies */
        supplies.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">Закупки отсутствуют.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">ID закупки</th>
                    <th className="px-6 py-4">Заказ / Изделие</th>
                    <th className="px-6 py-4">Материал</th>
                    <th className="px-6 py-4">Клиент</th>
                    <th className="px-6 py-4">Количество</th>
                    <th className="px-6 py-4">Сумма закупки</th>
                    <th className="px-6 py-4">Статус закупки</th>
                    <th className="px-6 py-4 text-right">Согласование</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {supplies.map(sup => {
                    const totalCost = sup.quantity * sup.actual_price;
                    const isDraft = sup.status === 'черновик';

                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/20 transition">
                        <td className="px-6 py-4 text-slate-400 font-bold">#{sup.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          #{sup.order_id} — {sup.order_product_type}
                        </td>
                        <td className="px-6 py-4 font-bold text-blue-600">{sup.material_name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{sup.client_name || '—'}</td>
                        <td className="px-6 py-4 font-semibold">{sup.quantity}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{totalCost.toLocaleString('ru-RU')} ₽</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-md border ${getSupplyStatusBadge(sup.status)}`}>
                            {sup.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isDraft ? (
                            <button
                              onClick={() => handleApproveSupply(sup.id, sup.status, sup.delivery_date)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Согласовать</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold italic flex justify-end gap-1.5 items-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>Согласовано</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal: Add Payment */}
      {selectedOrderId !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Внесение оплаты по заказу #{selectedOrderId}</h3>
              <button onClick={() => setSelectedOrderId(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {paymentFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {paymentFormError}
              </div>
            )}

            <form onSubmit={handleAddPayment} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Сумма оплаты (руб.)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Дата получения платежа (по умолчанию сегодня)</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Комментарий</label>
                <input
                  type="text"
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Аванс 50%, наличные, доплата..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderId(null)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                >
                  Внести
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
