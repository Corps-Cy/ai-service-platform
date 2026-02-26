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
    console.log('[Login] Starting login for:', email);

    try {
      const response = await apiService.login(email, password);
      console.log('[Login] Full response:', JSON.stringify(response, null, 2));
      console.log('[Login] Response data:', JSON.stringify(response?.data, null, 2));
      
      if (response && response.data) {
        const token = response.data.token;
        console.log('[Login] Extracted token:', token ? `${token.substring(0, 20)}...` : 'undefined');
        
        if (token) {
          // 先清除旧 token
          localStorage.removeItem('token');
          
          // 保存新 token
          localStorage.setItem('token', token);
          
          // 立即验证
          const savedToken = localStorage.getItem('token');
          console.log('[Login] Token saved verification:', !!savedToken);
          console.log('[Login] Saved token matches:', savedToken === token);
          
          if (!savedToken) {
            console.error('[Login] localStorage not working!');
            toast.error('无法保存登录状态，请检查浏览器设置或使用其他浏览器');
            setLoading(false);
            return;
          }

          if (savedToken !== token) {
            console.error('[Login] Token mismatch!');
            toast.error('登录状态保存异常');
            setLoading(false);
            return;
          }
          
          // 通知父组件更新状态
          console.log('[Login] Calling onLogin');
          onLogin();
          
          toast.success('登录成功！');
          
          // 延迟跳转，确保状态更新
          console.log('[Login] Will redirect in 100ms...');
          setTimeout(() => {
            console.log('[Login] Redirecting now. Current token:', localStorage.getItem('token') ? 'exists' : 'null');
            window.location.href = '/dashboard';
          }, 100);
        } else {
          console.error('[Login] No token in response.data');
          toast.error('登录失败：服务器未返回token');
        }
      } else {
        console.error('[Login] No response or response.data');
        toast.error('登录失败：服务器响应异常');
      }
    } catch (error: any) {
      console.error('[Login] Error:', error);
      console.error('[Login] Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.message || '登录失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-[#6366F1] to-[#818CF8] p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1E1B4B]">AI服务平台</span>
          </Link>
        </div>

        <div className="card animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1E1B4B] mb-2">欢迎回来</h1>
            <p className="text-gray-600">登录您的账户继续使用AI服务</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
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
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-[#6366F1]"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`btn btn-primary w-full ${loading ? 'opacity-70' : ''}`}>
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-2"></div>登录中...</>
              ) : (
                <><Lock className="w-5 h-5 mr-2" />登录<ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              还没有账户？
              <Link to="/register" className="text-[#6366F1] font-semibold hover:underline ml-1">立即注册</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
