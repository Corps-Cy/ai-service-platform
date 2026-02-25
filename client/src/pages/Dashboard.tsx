import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { CreditCard, TrendingUp, Calendar, Zap, ArrowRight } from 'lucide-react';

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
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#1E1B4B] mb-8">仪表板</h1>

      {/* 用户信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">用户</p>
              <p className="text-xl font-bold text-[#1E1B4B]">{user?.nickname || user?.email}</p>
            </div>
            <CreditCard className="w-8 h-8 text-[#6366F1]" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Token余额</p>
              <p className="text-xl font-bold text-[#6366F1]">{user?.tokens || 0}</p>
            </div>
            <Zap className="w-8 h-8 text-[#10B981]" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">订阅状态</p>
              <p className="text-xl font-bold text-[#10B981]">
                {user?.subscription ? user.subscription.plan : '无订阅'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-[#6366F1]" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总任务数</p>
              <p className="text-xl font-bold text-[#1E1B4B]">{tasks.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#818CF8]" />
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1E1B4B] mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/image"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#F5F3FF] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-6 h-6 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B4B]">文生图</h3>
                <p className="text-sm text-gray-600">创建图片</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/text"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#10B981]/10 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <CreditCard className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B4B]">文本生成</h3>
                <p className="text-sm text-gray-600">写作、翻译</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/pricing"
            className="card group cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-[#818CF8]/10 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <TrendingUp className="w-6 h-6 text-[#818CF8]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B4B]">购买套餐</h3>
                <p className="text-sm text-gray-600">充值tokens</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>

      {/* 最近任务 */}
      <div>
        <h2 className="text-2xl font-bold text-[#1E1B4B] mb-4">最近任务</h2>
        <div className="card">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">暂无任务，开始使用AI服务吧！</p>
              <Link to="/image" className="btn btn-primary inline-flex items-center">
                开始创作
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">任务ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">类型</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-50 hover:bg-[#F5F3FF]/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-mono text-gray-600">{task.task_id}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{task.type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.status === 'completed'
                              ? 'bg-[#10B981]/10 text-[#10B981]'
                              : task.status === 'processing'
                              ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                              : 'bg-red-100 text-red-600'
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
