import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Brain } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('请输入邮箱和密码');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.login(email, password);
      
      // 检查响应
      if (response.data && response.data.token) {
        // 保存token
        localStorage.setItem('token', response.data.token);
        
        // 通知父组件更新认证状态
        onLogin();
        
        toast.success('登录成功！');
        
        // 使用setTimeout确保状态更新后再导航
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        toast.error('登录失败：服务器响应异常');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || '登录失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-[#6366F1] to-[#818CF8] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E1B4B]">AI服务平台</span>
          </Link>
        </div>

        {/* 登录卡片 */}
        <div className="card animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1E1B4B] mb-2">欢迎回来</h1>
            <p className="text-gray-600">登录您的账户继续使用AI服务</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="•••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-[#6366F1] transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary w-full flex items-center justify-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                  登录中...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  登录
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              还没有账户？
              <Link to="/register" className="text-[#6366F1] font-semibold hover:underline ml-1">
                立即注册
              </Link>
            </p>
          </div>
        </div>

        {/* 装饰性背景元素 */}
        <div className="fixed top-20 -left-20 w-72 h-72 bg-white rounded-full blur-3xl opacity-5 pointer-events-none"></div>
        <div className="fixed bottom-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl opacity-5 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Login;
