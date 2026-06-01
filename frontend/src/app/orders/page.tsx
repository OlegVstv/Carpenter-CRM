'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Order, Task, Client } from '@/types';
import {
  Trash2,
  Plus,
  RefreshCw,
  FolderKanban,
  ClipboardList,
  CalendarDays,
  X,
  CheckSquare,
  Square,
  AlertCircle,
  Truck,
  Wrench,
} from 'lucide-react';

export default function OrdersAndTasksPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // New Order Form state
  const [orderClient, setOrderClient] = useState('');
  const [orderProduct, setOrderProduct] = useState('');
  const [orderSpec, setOrderSpec] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderStatus, setOrderStatus] = useState('принят');
  const [orderDelivery, setOrderDelivery] = useState('');
  const [orderInstall, setOrderInstall] = useState('');
  const [orderFormError, setOrderFormError] = useState<string | null>(null);

  // New Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState('средний');
  const [taskAssigned, setTaskAssigned] = useState('DIRECTOR');
  const [taskOrderId, setTaskOrderId] = useState('');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.getOrders().catch(() => []),
      api.getTasks().catch(() => []),
      api.getClients().catch(() => []),
    ])
      .then(([ordersData, tasksData, clientsData]) => {
        setOrders(ordersData);
        setTasks(tasksData);
        setClients(clientsData);
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

  // Order Actions
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderClient || !orderProduct || !orderPrice) {
      setOrderFormError('Укажите клиента, изделие и стоимость');
      return;
    }
    setOrderFormError(null);

    api.createOrder({
      client_id: parseInt(orderClient),
      product_type: orderProduct,
      technical_spec: orderSpec || null,
      price: parseFloat(orderPrice),
      status: orderStatus,
      delivery_date: orderDelivery || null,
      installation_date: orderInstall || null,
    })
      .then(() => {
        setIsOrderModalOpen(false);
        setOrderClient('');
        setOrderProduct('');
        setOrderSpec('');
        setOrderPrice('');
        setOrderStatus('принят');
        setOrderDelivery('');
        setOrderInstall('');
        fetchData();
      })
      .catch((err) => {
        setOrderFormError(err.message || 'Ошибка создания заказа');
      });
  };

  const handleUpdateOrderStatus = (id: number, status: string) => {
    api.updateOrderStatus(id, status)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка обновления статуса: ' + err.message);
      });
  };

  const handleDeleteOrder = (id: number) => {
    if (!confirm('Вы действительно хотите удалить этот заказ? Все связанные задачи и снабжение будут удалены.')) return;
    api.deleteOrder(id)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка удаления: ' + err.message);
      });
  };

  // Task Actions
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) {
      setTaskFormError('Введите название задачи');
      return;
    }
    setTaskFormError(null);

    api.createTask({
      title: taskTitle,
      description: taskDesc || null,
      due_date: taskDue || null,
      priority: taskPriority,
      status: 'нужно сделать',
      assigned_to: taskAssigned,
      order_id: taskOrderId ? parseInt(taskOrderId) : null,
    })
      .then(() => {
        setIsTaskModalOpen(false);
        setTaskTitle('');
        setTaskDesc('');
        setTaskDue('');
        setTaskPriority('средний');
        setTaskOrderId('');
        fetchData();
      })
      .catch((err) => {
        setTaskFormError(err.message || 'Ошибка создания задачи');
      });
  };

  const handleToggleTask = (task: Task) => {
    const nextStatus = task.status === 'выполнено' ? 'нужно сделать' : 'выполнено';
    api.updateTaskStatus(task.id, nextStatus)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка обновления статуса: ' + err.message);
      });
  };

  const handleUpdateTaskStatus = (id: number, status: string) => {
    api.updateTaskStatus(id, status)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка обновления статуса: ' + err.message);
      });
  };

  const handleDeleteTask = (id: number) => {
    if (!confirm('Вы действительно хотите удалить эту задачу?')) return;
    api.deleteTask(id)
      .then(() => {
        fetchData();
      })
      .catch((err) => {
        alert('Ошибка удаления: ' + err.message);
      });
  };

  // Build Calendar Timeline
  const getTimelineEvents = () => {
    const events: { date: string; type: 'task' | 'delivery' | 'installation'; title: string; subtitle: string; overdue: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tasks due dates
    tasks.forEach(t => {
      if (t.due_date && t.status !== 'выполнено' && t.status !== 'отменено') {
        const dueDate = new Date(t.due_date);
        events.push({
          date: t.due_date,
          type: 'task',
          title: `Дедлайн: ${t.title}`,
          subtitle: t.order_product_type ? `Под проект: ${t.order_product_type}` : 'Общая задача',
          overdue: dueDate < today,
        });
      }
    });

    // Orders delivery & installation dates
    orders.forEach(o => {
      if (!['сдан клиенту', 'закрыт', 'отказ'].includes(o.status)) {
        if (o.delivery_date) {
          const delDate = new Date(o.delivery_date);
          events.push({
            date: o.delivery_date,
            type: 'delivery',
            title: `Доставка: ${o.product_type}`,
            subtitle: `Заказ #${o.id} - ${o.client_name || `Клиент #${o.client_id}`}`,
            overdue: delDate < today && o.status !== 'готов',
          });
        }
        if (o.installation_date) {
          const instDate = new Date(o.installation_date);
          events.push({
            date: o.installation_date,
            type: 'installation',
            title: `Монтаж: ${o.product_type}`,
            subtitle: `Заказ #${o.id} - ${o.client_name || `Клиент #${o.client_id}`}`,
            overdue: instDate < today && o.status !== 'готов',
          });
        }
      }
    });

    // Group by Date and Sort
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grouped: Record<string, typeof events> = {};
    events.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    return grouped;
  };

  const timelineGrouped = getTimelineEvents();

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'принят': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'ожидает оплаты': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'согласован': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'передан в производство': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'ожидает материалы': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'в производстве': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'готов': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'на доставке': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'сдан клиенту': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'проблемный': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'нужно сделать': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'в процессе': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'выполнено': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'отменено': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'низкий': return 'bg-slate-100 text-slate-600';
      case 'средний': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'высокий': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'критический': return 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const ORDER_STATUSES = [
    'принят', 'ожидает оплаты', 'согласован', 'передан в производство',
    'ожидает материалы', 'в производстве', 'готов', 'на доставке',
    'сдан клиенту', 'закрыт', 'приостановлен', 'проблемный'
  ];

  const TASK_STATUSES = ['нужно сделать', 'в процессе', 'выполнено', 'отменено'];
  const TASK_PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Заказы и задачи</h1>
          <p className="text-sm text-slate-500 mt-1">
            Координация производственного цикла, контроль задач и календарный план мастерской.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition shadow-sm"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md shadow-blue-500/10"
          >
            <FolderKanban className="w-5 h-5" />
            <span>Новый заказ</span>
          </button>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-semibold transition shadow-md"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Новая задача</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6 animate-pulse">
            <div className="h-64 bg-slate-200 rounded-2xl" />
            <div className="h-64 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Orders and Tasks Lists */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Orders Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-500" />
                <span>Производственные заказы</span>
              </h2>

              {orders.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Нет оформленных заказов.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-4">ID</th>
                        <th className="pb-3 pr-4">Клиент</th>
                        <th className="pb-3 pr-4">Изделие</th>
                        <th className="pb-3 pr-4">Стоимость</th>
                        <th className="pb-3 pr-4">Статус заказа</th>
                        <th className="pb-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {orders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/30 transition">
                          <td className="py-4 text-slate-400 font-bold pr-4">#{order.id}</td>
                          <td className="py-4 font-bold text-slate-800 pr-4">{order.client_name || `Клиент #${order.client_id}`}</td>
                          <td className="py-4 font-medium pr-4">{order.product_type}</td>
                          <td className="py-4 font-bold pr-4">{order.price.toLocaleString('ru-RU')} ₽</td>
                          <td className="py-4 pr-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md border focus:outline-none cursor-pointer ${getOrderStatusColor(order.status)}`}
                            >
                              {ORDER_STATUSES.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Удалить заказ"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tasks List Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                <span>Список задач мастерской</span>
              </h2>

              {tasks.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">Нет назначенных задач.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-4" style={{ width: '40px' }}>Закр</th>
                        <th className="pb-3 pr-4">Название</th>
                        <th className="pb-3 pr-4">Дедлайн</th>
                        <th className="pb-3 pr-4">Приоритет</th>
                        <th className="pb-3 pr-4">Статус</th>
                        <th className="pb-3 pr-4">Проект</th>
                        <th className="pb-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                      {tasks.map(task => {
                        const isDone = task.status === 'выполнено';

                        return (
                          <tr key={task.id} className={`hover:bg-slate-50/30 transition ${isDone ? 'opacity-60' : ''}`}>
                            <td className="py-4 pr-4">
                              <button
                                onClick={() => handleToggleTask(task)}
                                className="text-slate-400 hover:text-blue-600 transition"
                              >
                                {isDone ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </td>
                            <td className={`py-4 pr-4 font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.title}
                              {task.description && (
                                <p className="text-[11px] text-slate-400 font-normal mt-0.5 max-w-xs truncate" title={task.description}>
                                  {task.description}
                                </p>
                              )}
                            </td>
                            <td className="py-4 pr-4 text-xs font-semibold text-slate-500">
                              {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}
                            </td>
                            <td className="py-4 pr-4">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                className={`px-2 py-0.5 text-[11px] font-bold rounded border focus:outline-none cursor-pointer ${getTaskStatusColor(task.status)}`}
                              >
                                {TASK_STATUSES.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-4 pr-4 text-xs font-semibold text-slate-400 max-w-[120px] truncate" title={task.order_product_type || ''}>
                              {task.order_product_type || '—'}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Удалить задачу"
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
              )}
            </div>
          </div>

          {/* Right Column: Calendar Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 h-fit">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-500" />
              <span>Календарный план</span>
            </h2>

            {Object.keys(timelineGrouped).length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">Нет запланированных событий.</p>
            ) : (
              <div className="space-y-5 overflow-y-auto max-h-[600px] pr-2">
                {Object.entries(timelineGrouped).map(([date, dayEvents]) => {
                  const dateObj = new Date(date);
                  const formatDay = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                  const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' });

                  return (
                    <div key={date} className="relative border-l-2 border-blue-500 pl-4 space-y-2">
                      {/* Date Bubble */}
                      <div className="absolute -left-[7px] top-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        {formatDay} <span className="text-slate-400 font-semibold lowercase">({weekday})</span>
                      </div>

                      {/* Events under this day */}
                      <div className="space-y-2">
                        {dayEvents.map((ev, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs shadow-sm flex items-start gap-2.5 transition hover:shadow ${
                              ev.overdue
                                ? 'bg-rose-50 border-rose-200'
                                : ev.type === 'task'
                                ? 'bg-indigo-50/50 border-indigo-100'
                                : ev.type === 'delivery'
                                ? 'bg-emerald-50/50 border-emerald-100'
                                : 'bg-amber-50/50 border-amber-100'
                            }`}
                          >
                            {ev.type === 'delivery' ? (
                              <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            ) : ev.type === 'installation' ? (
                              <Wrench className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <ClipboardList className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <p className={`font-bold text-slate-800 ${ev.overdue ? 'text-rose-950 font-black' : ''}`}>
                                {ev.title}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{ev.subtitle}</p>
                              {ev.overdue && (
                                <span className="inline-block px-1.5 py-0.5 bg-rose-200 text-rose-800 font-black rounded text-[9px] uppercase tracking-wider mt-1.5">
                                  Просрочено!
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Order */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Создание нового заказа</h3>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {orderFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {orderFormError}
              </div>
            )}

            {clients.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">Создайте сначала клиента в базе.</p>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-4 text-sm font-medium">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Клиент</label>
                  <select
                    value={orderClient}
                    onChange={(e) => setOrderClient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- Выберите клиента --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Изделие / Вид работ</label>
                  <input
                    type="text"
                    value={orderProduct}
                    onChange={(e) => setOrderProduct(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    placeholder="Например: Стол дубовый обеденный"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Техническое описание (ТЗ)</label>
                  <textarea
                    value={orderSpec}
                    onChange={(e) => setOrderSpec(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold resize-none"
                    placeholder="Размеры, материал, цвет покрытия..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Стоимость (руб.)</label>
                    <input
                      type="number"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Начальный статус</label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      {ORDER_STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Дата доставки</label>
                    <input
                      type="date"
                      value={orderDelivery}
                      onChange={(e) => setOrderDelivery(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Дата монтажа</label>
                    <input
                      type="date"
                      value={orderInstall}
                      onChange={(e) => setOrderInstall(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                  >
                    Создать заказ
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Создание новой задачи</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {taskFormError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
                {taskFormError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-sm font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Название задачи</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  placeholder="Например: Закупить лак для обеденного стола"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Описание задачи</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold resize-none"
                  placeholder="Детали выполнения, примечания..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Срок выполнения (Дедлайн)</label>
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Приоритет</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {TASK_PRIORITIES.map(pr => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Исполнитель</label>
                  <select
                    value={taskAssigned}
                    onChange={(e) => setTaskAssigned(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="DIRECTOR">Директор</option>
                    <option value="MANAGER">Менеджер</option>
                    <option value="FOREMAN">Начальник цеха</option>
                    <option value="SUPPLIER">Снабженец</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Связанный заказ (опц.)</label>
                  <select
                    value={taskOrderId}
                    onChange={(e) => setTaskOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="">-- Нет связи с проектом --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>#{o.id} - {o.product_type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition shadow-md"
                >
                  Создать задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
