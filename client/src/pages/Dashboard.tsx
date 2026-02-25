import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { CreditCard, TrendingUp, Calendar, Zap, ArrowRight, Image, FileText, Brain, BarChart3, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      const [userRes, tasksRes] = await Promise.all([
        apiService.getUserInfo(),
        apiService.getTasks(10, 0)
      ]);
      
      setUser(userRes.data.user);
      setTasks(tasksRes.data.tasks || []);
    } catch (error: any) {
      console.error('Load data error:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }
      setError(error.response?.data?.error || '加载数据失败');
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center">
        <div className="text-center card">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-[#1E1B4B] mb-8">仪表板</h1>

        {/* 用户信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">用户</p>
                <p className="text-xl font-bold text-[#1E1B4B]">{user?.nickname || user?.email || '未知'}</p>
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
                  {user?.subscription?.plan || '无订阅'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/image"
              className="card group cursor-pointer hover:border-[#6366F1] transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-[#F5F3FF] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Image className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1E1B4B]">文生图</p>
                  <p className="text-sm text-gray-500">AI图像生成</p>
                </div>
              </div>
            </Link>

            <Link
              to="/text"
              className="card group cursor-pointer hover:border-[#6366F1] transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-[#F5F3FF] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Brain className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1E1B4B]">文本生成</p>
                  <p className="text-sm text-gray-500">智能写作助手</p>
                </div>
              </div>
            </Link>

            <Link
              to="/image-understand"
              className="card group cursor-pointer hover:border-[#6366F1] transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-[#F5F3FF] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1E1B4B]">图片理解</p>
                  <p className="text-sm text-gray-500">智能图像分析</p>
                </div>
              </div>
            </Link>

            <Link
              to="/document"
              className="card group cursor-pointer hover:border-[#6366F1] transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-[#F5F3FF] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <p className="font-semibold text-[#1E1B4B]">文档处理</p>
                  <p className="text-sm text-gray-500">智能文档分析</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 最近任务 */}
        <div>
          <h2 className="text-2xl font-bold text-[#1E1B4B] mb-4">最近任务</h2>
          {tasks.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 mb-4">暂无任务记录</p>
              <Link to="/image" className="btn btn-primary">
                开始创作
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">任务ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">类型</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 10).map((task: any) => (
                    <tr key={task.id} className="border-t border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-800">{task.task_id}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{task.type}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : task.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {task.status}
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
