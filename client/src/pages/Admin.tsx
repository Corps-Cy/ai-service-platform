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
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Filter,
  Calendar,
  Mail,
  Shield,
  User as UserIcon,
  Copy,
  X,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

interface UserDetail {
  user: User;
  tokens: { tokens: number; expires_at: string | null } | null;
  subscription: { id: number; plan: string; status: string; expires_at: string } | null;
  orders: Order[];
  tasks: any[];
}

interface Order {
  id: number;
  order_no: string;
  email: string;
  amount: number;
  payment_method: string;
  status: string;
  product_type: string;
  product_id: string | null;
  description: string | null;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface Subscription {
  id: number;
  user_id: number;
  email: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
}

interface Plan {
  id: number;
  name: string;
  type: string;
  price: number;
  duration: number;
  tokens: number;
  features: string[];
  is_active: number;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'orders' | 'subscriptions' | 'plans'>('dashboard');
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
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-600">🎛️ 管理后台</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex space-x-2 bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-sm overflow-x-auto">
            {[
              { id: 'dashboard' as const, label: '概览', icon: Activity },
              { id: 'users' as const, label: '用户', icon: Users },
              { id: 'orders' as const, label: '订单', icon: ShoppingBag },
              { id: 'subscriptions' as const, label: '订阅', icon: Package },
              { id: 'plans' as const, label: '套餐', icon: DollarSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
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

        {activeTab === 'dashboard' && <DashboardTab stats={stats} loading={loading} refreshStats={fetchStats} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'plans' && <PlansTab />}
      </div>
    </div>
  );
}

function DashboardTab({ stats, loading, refreshStats }: { stats: Stats | null; loading: boolean; refreshStats: () => void }) {
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">数据概览</h2>
        <button
          onClick={refreshStats}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新</span>
        </button>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskStatsCard stats={stats} />
        <QueueStatsCard stats={stats} />
      </div>

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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/admin/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleViewUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSelectedUser(data);
      setShowUserModal(true);
    } catch (error) {
      toast.error('加载用户详情失败');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nickname: editingUser.nickname,
        }),
      });

      if (response.ok) {
        toast.success('用户信息更新成功');
        setShowEditModal(false);
        fetchUsers();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除此用户吗？此操作不可恢复。')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('用户删除成功');
        fetchUsers();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">用户管理</h2>
        <button
          onClick={fetchUsers}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          <span>刷新</span>
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索用户邮箱或昵称..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">邮箱</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">昵称</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{user.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {user.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {user.nickname || <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === p
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 用户详情模态框 */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">用户详情</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  基本信息
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="font-semibold">{selectedUser.user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">邮箱</span>
                    <span className="font-semibold">{selectedUser.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">昵称</span>
                    <span className="font-semibold">{selectedUser.user.nickname || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">创建时间</span>
                    <span className="font-semibold">
                      {new Date(selectedUser.user.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>

                {selectedUser.tokens && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-6 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-emerald-500" />
                      Token信息
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">当前Tokens</span>
                        <span className="font-semibold text-2xl text-indigo-600">
                          {selectedUser.tokens.tokens}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">过期时间</span>
                        <span className="font-semibold">
                          {selectedUser.tokens.expires_at
                            ? new Date(selectedUser.tokens.expires_at).toLocaleDateString('zh-CN')
                            : '永久'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {selectedUser.subscription && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-6 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-amber-500" />
                      订阅信息
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">套餐</span>
                        <span className="font-semibold">{selectedUser.subscription.plan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">状态</span>
                        <span className={`font-semibold ${
                          selectedUser.subscription.status === 'active'
                            ? 'text-emerald-600'
                            : selectedUser.subscription.status === 'expired'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          {selectedUser.subscription.status === 'active'
                            ? '活跃'
                            : selectedUser.subscription.status === 'expired'
                            ? '已过期'
                            : selectedUser.subscription.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">到期时间</span>
                        <span className="font-semibold">
                          {new Date(selectedUser.subscription.expires_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-sky-500" />
                  最近订单
                </h4>
                <div className="space-y-3">
                  {selectedUser.orders.length === 0 ? (
                    <p className="text-gray-500">暂无订单</p>
                  ) : (
                    selectedUser.orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-sm">{order.order_no}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : order.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'paid' ? '已支付' : order.status === 'pending' ? '待支付' : order.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>¥{order.amount.toFixed(2)}</span>
                          <span>{new Date(order.created_at).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedUser.tasks.length > 0 && (
                  <>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 mt-6 flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-purple-500" />
                      最近任务
                    </h4>
                    <div className="space-y-3">
                      {selectedUser.tasks.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm">{task.task_id}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : task.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {task.status === 'completed' ? '已完成' : task.status === 'failed' ? '失败' : '处理中'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{task.type}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑用户模态框 */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">编辑用户</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                <input
                  type="email"
                  value={editingUser.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                <input
                  type="text"
                  value={editingUser.nickname || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, nickname: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleSaveUser}
                className="w-full btn btn-primary py-3 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/admin/orders?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleViewOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSelectedOrder(data.order);
      setShowOrderModal(true);
    } catch (error) {
      toast.error('加载订单详情失败');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('订单状态更新成功');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleExportOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/admin/orders?page=1&limit=1000${statusFilter ? `&status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      const csv = [
        ['订单号', '邮箱', '金额', '支付方式', '状态', '产品类型', '创建时间', '支付时间'].join(','),
        ...data.orders.map((order: Order) => [
          order.order_no,
          order.email,
          order.amount,
          order.payment_method,
          order.status,
          order.product_type,
          order.created_at,
          order.paid_at || '',
        ].join(',')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('导出成功');
    } catch (error) {
      toast.error('导出失败');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">订单管理</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExportOrders}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
          <button
            onClick={fetchOrders}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="refunded">已退款</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">邮箱</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">支付方式</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800 font-mono">{order.order_no}</td>
                    <td className="py-3 px-4 text-sm text-gray-800 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {order.email}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-indigo-600">
                      ¥{order.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {order.payment_method === 'wechat' ? '微信支付' : '支付宝'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'refunded'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'paid' ? '已支付' :
                         order.status === 'pending' ? '待支付' :
                         order.status === 'refunded' ? '已退款' :
                         order.status === 'cancelled' ? '已取消' : order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === p
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 订单详情模态框 */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">订单详情</h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">订单号</p>
                  <p className="font-mono font-semibold">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">状态</p>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                    className="px-3 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">待支付</option>
                    <option value="paid">已支付</option>
                    <option value="refunded">已退款</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">邮箱</p>
                  <p className="font-semibold">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">金额</p>
                  <p className="font-semibold text-2xl text-indigo-600">¥{selectedOrder.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">支付方式</p>
                  <p className="font-semibold">
                    {selectedOrder.payment_method === 'wechat' ? '微信支付' : '支付宝'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">产品类型</p>
                  <p className="font-semibold">
                    {selectedOrder.product_type === 'plan' ? '套餐' :
                     selectedOrder.product_type === 'tokens' ? 'Tokens充值' :
                     selectedOrder.product_type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">创建时间</p>
                  <p className="font-semibold">{new Date(selectedOrder.created_at).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">支付时间</p>
                  <p className="font-semibold">
                    {selectedOrder.paid_at ? new Date(selectedOrder.paid_at).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
              </div>

              {selectedOrder.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">描述</p>
                  <p className="font-semibold">{selectedOrder.description}</p>
                </div>
              )}

              {selectedOrder.transaction_id && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">交易ID</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm">{selectedOrder.transaction_id}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.transaction_id!);
                        toast.success('已复制到剪贴板');
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checking, setChecking] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = `/api/admin/subscriptions?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      toast.error('加载订阅列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  const handleCheckExpiry = async () => {
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscriptions/check-expiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`已检查并更新了 ${data.updatedCount} 个过期订阅`);
        fetchSubscriptions();
      } else {
        toast.error('检查失败');
      }
    } catch (error) {
      toast.error('检查失败');
    } finally {
      setChecking(false);
    }
  };

  const handleSendExpiryReminders = async (days: number) => {
    setSendingReminders(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/subscriptions/send-expiry-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`已发送 ${data.sentCount} 条到期提醒邮件`);
      } else {
        toast.error('发送失败');
      }
    } catch (error) {
      toast.error('发送失败');
    } finally {
      setSendingReminders(false);
    }
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('订阅状态更新成功');
        fetchSubscriptions();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">订阅管理</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCheckExpiry}
            disabled={checking}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            <span>检查到期</span>
          </button>
          <button
            onClick={() => handleSendExpiryReminders(7)}
            disabled={sendingReminders}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            <span>7天提醒</span>
          </button>
          <button
            onClick={() => handleSendExpiryReminders(3)}
            disabled={sendingReminders}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            <span>3天提醒</span>
          </button>
          <button
            onClick={fetchSubscriptions}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="expired">已过期</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">邮箱</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">套餐</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">到期时间</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">剩余天数</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {sub.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={sub.status}
                        onChange={(e) => handleUpdateSubscriptionStatus(sub.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border-0 ${
                          sub.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : sub.status === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="active">活跃</option>
                        <option value="expired">已过期</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sub.expires_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-semibold ${
                        getDaysRemaining(sub.expires_at) <= 7
                          ? 'text-red-600'
                          : getDaysRemaining(sub.expires_at) <= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {getDaysRemaining(sub.expires_at)} 天
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {sub.status === 'active' && getDaysRemaining(sub.expires_at) <= 30 && (
                        <span className="text-xs text-amber-600">即将到期</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    page === p
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 hover:bg-indigo-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    type: 'monthly',
    price: 0,
    duration: 30,
    tokens: 1000,
    features: [] as string[],
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/plans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      toast.error('加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPlan),
      });

      if (response.ok) {
        toast.success('套餐创建成功');
        setShowCreateModal(false);
        setNewPlan({
          name: '',
          type: 'monthly',
          price: 0,
          duration: 30,
          tokens: 1000,
          features: [],
        });
        fetchPlans();
      } else {
        toast.error('创建失败');
      }
    } catch (error) {
      toast.error('创建失败');
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingPlan),
      });

      if (response.ok) {
        toast.success('套餐更新成功');
        setShowEditModal(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('确定要删除此套餐吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('套餐删除成功');
        fetchPlans();
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: plan.is_active === 1 ? 0 : 1 }),
      });

      if (response.ok) {
        toast.success('套餐状态更新成功');
        fetchPlans();
      } else {
        toast.error('更新失败');
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">套餐管理</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>创建套餐</span>
          </button>
          <button
            onClick={fetchPlans}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const features = typeof plan.features === 'string'
              ? JSON.parse(plan.features)
              : plan.features;

            return (
              <div
                key={plan.id}
                className={`border-2 rounded-2xl p-6 transition-all ${
                  plan.is_active === 1
                    ? 'border-indigo-200 hover:border-indigo-300'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                  <button
                    onClick={() => handleTogglePlanActive(plan)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      plan.is_active === 1
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {plan.is_active === 1 ? '启用' : '禁用'}
                  </button>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-indigo-600">¥{plan.price}</span>
                  <span className="text-gray-500">/{plan.duration}天</span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>{plan.tokens} Tokens</span>
                  </div>
                  {features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowEditModal(true);
                    }}
                    className="flex-1 btn btn-secondary py-2 flex items-center justify-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>编辑</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 创建套餐模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">创建套餐</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">套餐名称</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <select
                  value={newPlan.type}
                  onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="monthly">月卡</option>
                  <option value="quarterly">季卡</option>
                  <option value="yearly">年卡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格 (元)</label>
                <input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">有效期 (天)</label>
                <input
                  type="number"
                  value={newPlan.duration}
                  onChange={(e) => setNewPlan({ ...newPlan, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tokens</label>
                <input
                  type="number"
                  value={newPlan.tokens}
                  onChange={(e) => setNewPlan({ ...newPlan, tokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleCreatePlan}
                className="w-full btn btn-primary py-3"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑套餐模态框 */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">编辑套餐</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPlan(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">套餐名称</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">价格 (元)</label>
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">有效期 (天)</label>
                <input
                  type="number"
                  value={editingPlan.duration}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tokens</label>
                <input
                  type="number"
                  value={editingPlan.tokens}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={editingPlan.is_active}
                  onChange={(e) => setEditingPlan({ ...editingPlan, is_active: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
                </select>
              </div>
              <button
                onClick={handleUpdatePlan}
                className="w-full btn btn-primary py-3 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>保存</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
