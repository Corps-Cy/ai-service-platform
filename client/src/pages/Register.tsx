import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, CheckCircle, Brain, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface RegisterProps {
  onRegister?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!formData.email || !formData.password || !formData.nickname) {
      toast.error('请填写所有字段');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.register(formData.email, formData.password, formData.nickname);
      const { token } = response.data;
      
      // 保存token
      localStorage.setItem('token', token);
      
      // 通知父组件
      if (onRegister) {
        onRegister();
      }
      
      toast.success('注册成功！');
      
      // 跳转到仪表板
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '注册失败');
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

        {/* 注册卡片 */}
        <div className="card animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1E1B4B] mb-2">创建账户</h1>
            <p className="text-gray-600">加入我们，开启AI创作之旅</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            {/* 昵称输入 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-semibold text-gray-700 mb-2">
                昵称
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="input pl-10"
                  placeholder="您的昵称"
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input pl-10"
                  placeholder="your@email.com"
                  required
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="至少6位字符"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-[#6366F1] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input pl-10 pr-10"
                  placeholder="再次输入密码"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 hover:text-[#6366F1] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 注册按钮 */}
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
                  注册中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  创建账户
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              已有账户？
              <Link to="/login" className="text-[#6366F1] font-semibold hover:underline">
                立即登录
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

export default Register;
