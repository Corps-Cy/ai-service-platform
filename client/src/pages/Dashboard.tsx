import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { CreditCard, TrendingUp, Calendar, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userRes, tasksRes] = await Promise.all([
        apiService.getUserInfo(),
        apiService.getTasks(10, 0)
      ]);
      setUser(userRes.data.user);
      setTasks(tasksRes.data.tasks);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">仪表板</h1>

      {/* 用户信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">用户</p>
              <p className="text-xl font-bold text-gray-900">{user?.nickname || user?.email}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Token余额</p>
              <p className="text-xl font-bold text-blue-600">{user?.tokens || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">订阅状态</p>
              <p className="text-xl font-bold text-green-600">
                {user?.subscription ? user.subscription.plan : '无订阅'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总任务数</p>
              <p className="text-xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/image"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">文生图</h3>
                <p className="text-sm text-gray-600">创建图片</p>
              </div>
            </div>
          </Link>

          <Link
            to="/text"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">文本生成</h3>
                <p className="text-sm text-gray-600">写作、翻译</p>
              </div>
            </div>
          </Link>

          <Link
            to="/pricing"
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">购买套餐</h3>
                <p className="text-sm text-gray-600">充值tokens</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 最近任务 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">最近任务</h2>
        <div className="card">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              暂无任务，开始使用AI服务吧！
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">任务ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">类型</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm">{task.task_id}</td>
                      <td className="py-3 px-4 text-sm">{task.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {task.status === 'completed' ? '已完成' : task.status === 'processing' ? '处理中' : '失败'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(task.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
