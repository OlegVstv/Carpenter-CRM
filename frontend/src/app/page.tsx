'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { FinancialSummary, Order, Task } from '@/types';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  PiggyBank,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getFinancialSummary().catch(() => null),
      api.getOrders().catch(() => []),
      api.getTasks().catch(() => []),
    ])
      .then(([summaryData, ordersData, tasksData]) => {
        setSummary(summaryData);
        setOrders(ordersData);
        setTasks(tasksData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Ошибка загрузки данных');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-slate-200 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border border-red-100">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <h2 className="font-bold text-lg">Ошибка загрузки</h2>
        </div>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  // Calculate some analytics
  const activeOrders = orders.filter(o => !['сдан клиенту', 'закрыт', 'отказ'].includes(o.status));
  const problemOrders = orders.filter(o => o.status === 'проблемный');
  const readyOrders = orders.filter(o => o.status === 'готов');
  const pendingTasks = tasks.filter(t => t.status !== 'выполнено' && t.status !== 'отменено');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Панель показателей</h1>
        <p className="text-sm text-slate-500 mt-1">
          Сводный баланс, аналитика производства и предупреждения о рисках.
        </p>
      </div>

      {/* Financial Summary Cards Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
          {/* Card 1: Total Revenue */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-5 rounded-2xl text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Общая выручка</span>
              <TrendingUp className="w-5 h-5 text-slate-400 group-hover:scale-110 transition" />
            </div>
            <span className="text-xl font-bold tracking-tight">{formatCurrency(summary.total_revenue)}</span>
          </div>

          {/* Card 2: Total Paid */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-5 rounded-2xl text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Всего оплачено</span>
              <DollarSign className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition" />
            </div>
            <span className="text-xl font-bold tracking-tight">{formatCurrency(summary.total_paid)}</span>
          </div>

          {/* Card 3: Debts */}
          <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-5 rounded-2xl text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Долг клиентов</span>
              <AlertTriangle className="w-5 h-5 text-orange-100 group-hover:scale-110 transition" />
            </div>
            <span className="text-xl font-bold tracking-tight">{formatCurrency(summary.total_debt)}</span>
          </div>

          {/* Card 4: Materials Expenses */}
          <div className="bg-gradient-to-br from-purple-700 to-pink-500 p-5 rounded-2xl text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Затраты на материалы</span>
              <Package className="w-5 h-5 text-purple-100 group-hover:scale-110 transition" />
            </div>
            <span className="text-xl font-bold tracking-tight">{formatCurrency(summary.total_expenses)}</span>
          </div>

          {/* Card 5: Expected Net Profit */}
          <div className="bg-gradient-to-br from-teal-800 to-emerald-600 p-5 rounded-2xl text-white shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-32 group">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">Ожидаемая прибыль</span>
              <PiggyBank className="w-5 h-5 text-teal-100 group-hover:scale-110 transition" />
            </div>
            <span className="text-xl font-bold tracking-tight">{formatCurrency(summary.net_profit)}</span>
          </div>
        </div>
      )}

      {/* Main Analysis and Risks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Production Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Текущее производство</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-2xl font-black text-blue-600">{activeOrders.length}</span>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Заказов в работе</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-2xl font-black text-emerald-600">{readyOrders.length}</span>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Готовы к сдаче</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-2xl font-black text-indigo-600">{pendingTasks.length}</span>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-1">Активных задач</p>
              </div>
            </div>
          </div>

          {/* Quick Orders List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Активные проекты</h2>
              <Link href="/orders" className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                Все заказы
              </Link>
            </div>
            {activeOrders.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">Нет активных проектов в производстве</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Заказ</th>
                      <th className="pb-3">Клиент</th>
                      <th className="pb-3">Изделие</th>
                      <th className="pb-3">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {activeOrders.slice(0, 5).map(order => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 font-semibold text-slate-500">#{order.id}</td>
                        <td className="py-3 font-bold text-slate-800">{order.client_name || `Клиент #${order.client_id}`}</td>
                        <td className="py-3 font-medium">{order.product_type}</td>
                        <td className="py-3">
                          <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Overdue/Risks Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Зоны риска</span>
            </h2>

            {/* Overdue/Problem list */}
            <div className="space-y-3">
              {problemOrders.length === 0 && pendingTasks.length === 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs flex gap-2 items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Критических рисков и проблемных заказов не найдено.</span>
                </div>
              )}

              {/* Problem orders warnings */}
              {problemOrders.map(order => (
                <div key={order.id} className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">Заказ #{order.id} отмечен проблемным</h4>
                    <p className="text-[11px] text-rose-700/80 mt-1 font-semibold">Изделие: {order.product_type}</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">Клиент: {order.client_name}</p>
                  </div>
                </div>
              ))}

              {/* Pending tasks checklist */}
              {pendingTasks.slice(0, 3).map(task => (
                <div key={task.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 items-start">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{task.description || 'Нет описания'}</p>
                    <div className="flex gap-2 items-center mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Дедлайн: {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
