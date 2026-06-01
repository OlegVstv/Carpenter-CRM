'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ClipboardList,
  Truck,
  Coins,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '@/services/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('UNKNOWN');
  const [healthStatus, setHealthStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  useEffect(() => {
    api.getHealth()
      .then((data) => {
        setRole(data.current_role);
        setHealthStatus(data.database === 'connected' ? 'connected' : 'disconnected');
      })
      .catch(() => {
        setRole('OFFLINE');
        setHealthStatus('disconnected');
      });
  }, []);

  const menuItems = [
    { name: 'Панель / Итоги', href: '/', icon: LayoutDashboard },
    { name: 'Входящие Лиды', href: '/leads', icon: Zap },
    { name: 'База Клиентов', href: '/clients', icon: Users },
    { name: 'Заказы и Календарь', href: '/orders', icon: FolderKanban },
    { name: 'Снабжение / Закупки', href: '/supply', icon: Truck },
    { name: 'Финансовый учет', href: '/finance', icon: Coins },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-xl z-30">
      {/* Header / Logo */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-content flex-wrap p-1.5 justify-center shadow-lg shadow-blue-500/30">
          <span className="font-bold text-lg text-white">C</span>
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white">Carpenter CRM</h1>
          <p className="text-[10px] text-slate-400 font-medium">Внутренний портал</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Status & Role */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Статус БД</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : healthStatus === 'loading'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span
              className={`font-semibold ${
                healthStatus === 'connected'
                  ? 'text-emerald-400'
                  : healthStatus === 'loading'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {healthStatus === 'connected' ? 'ОК' : healthStatus === 'loading' ? 'Связь...' : 'Ошибка'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/40">
          <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Текущая роль</p>
            <p className="text-xs font-bold text-slate-200 truncate">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
