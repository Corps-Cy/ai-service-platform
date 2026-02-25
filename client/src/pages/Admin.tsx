import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  CheckCircle,
  TrendingUp,
  Activity,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react';

interface Stats {
  users: { total: number; today: number };
  orders: { total: number; paid: number; today: number; todayRevenue: number };
  subscriptions: { active: number };
  tasks: { total: number; completed: number; today: number };
  queue: { waiting: number; active: number; completed: number; failed: number };
  cache: { keys: number; memory: string };
}

interface User {
  id: number;
  email: string;
  nickname: string | null;
  created_at: string;
}

interface Order {
  id: number;
  order_no: string;
  email: string;
  amount: number;
  payment_method: string;
  status: string;
  product_type: string;
  created_at: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'orders' | 'subscriptions'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* 导航栏 */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600">🎛️ 管理后台</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签页导航 */}
        <div className="mb-8">
          <div className="flex space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-sm">
            {[
              { id: 'dashboard' as const, label: '概览', icon: Activity },
              { id: 'users' as const, label: '用户', icon: Users },
              { id: 'orders' as const, label: '订单', icon: ShoppingBag },
              { id: 'subscriptions' as const, label: '订阅', icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        {activeTab === 'dashboard' && <DashboardTab stats={stats} loading={loading} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
      </div>
    </div>
  );
}

function DashboardTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>加载统计数据失败</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户"
          value={stats.users.total}
          change={`+${stats.users.today} 今日`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="总订单"
          value={stats.orders.total}
          change={`${stats.orders.paid} 已支付`}
          icon={ShoppingBag}
          color="emerald"
        />
        <StatCard
          title="今日收入"
          value={`¥${stats.orders.todayRevenue.toFixed(2)}`}
          change={`${stats.orders.today} 单`}
          icon={DollarSign}
          color="sky"
        />
        <StatCard
          title="活跃订阅"
          value={stats.subscriptions.active}
          change="当前有效"
          icon={CheckCircle}
          color="amber"
        />
      </div>

      {/* 任务统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatsCard stats={stats} />
        <QueueStatsCard stats={stats} />
      </div>

      {/* 缓存统计 */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-500" />
          缓存状态
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">缓存键数量</p>
            <p className="text-2xl font-bold text-gray-800">{stats.cache.keys}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">内存使用</p>
            <p className="text-2xl font-bold text-gray-800">{stats.cache.memory}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  change: string;
  icon: any;
  color: 'indigo' | 'emerald' | 'sky' | 'amber';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    sky: 'bg-sky-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{change}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function TaskStatsCard({ stats }: { stats: Stats }) {
  const completionRate = stats.tasks.total > 0
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 0;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-indigo-500" />
        任务统计
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">总任务</span>
          <span className="font-semibold text-gray-800">{stats.tasks.total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">已完成</span>
          <span className="font-semibold text-emerald-600">{stats.tasks.completed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">今日新增</span>
          <span className="font-semibold text-indigo-600">{stats.tasks.today}</span>
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">完成率</span>
            <span className="text-sm font-semibold text-indigo-600">{completionRate}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueStatsCard({ stats }: { stats: Stats }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-indigo-500" />
        队列状态
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">等待中</span>
          <span className="font-semibold text-amber-600">{stats.queue.waiting}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">处理中</span>
          <span className="font-semibold text-indigo-600">{stats.queue.active}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">已完成</span>
          <span className="font-semibold text-emerald-600">{stats.queue.completed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">失败</span>
          <span className="font-semibold text-red-600">{stats.queue.failed}</span>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="搜索用户..."
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <p className="text-gray-500 text-center py-8">用户列表开发中...</p>
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">订单管理</h2>
        <div className="flex space-x-2">
          <select className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
      </div>
      <p className="text-gray-500 text-center py-8">订单列表开发中...</p>
    </div>
  );
}

function SubscriptionsTab() {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">订阅管理</h2>
        <div className="flex space-x-2">
          <select className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="expired">已过期</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>
      <p className="text-gray-500 text-center py-8">订阅列表开发中...</p>
    </div>
  );
}
