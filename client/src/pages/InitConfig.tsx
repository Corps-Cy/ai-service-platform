import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import {
  Database,
  Lock,
  Mail,
  CreditCard,
  Smartphone,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

const InitConfig: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    zhipuApiKey: '',
    jwtSecret: '',
    databasePath: './data/database.sqlite',
    redisHost: 'localhost',
    redisPort: '6379',
    emailHost: '',
    emailPort: '587',
    emailUser: '',
    emailPassword: '',
    emailFrom: '',
    wechatAppid: '',
    wechatMchid: '',
    wechatSerialNo: '',
    wechatPrivateKey: '',
    alipayAppid: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkConfigStatus();
  }, []);

  const checkConfigStatus = async () => {
    try {
      const response = await fetch('/api/init/status');
      const data = await response.json();

      if (data.configured) {
        setIsConfigured(true);
        navigate('/dashboard');
      }

      setLoading(false);
    } catch (error) {
      // 如果API调用失败，可能是还没配置，允许显示初始化页面
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.zhipuApiKey.trim()) {
      newErrors.zhipuApiKey = '智谱API密钥不能为空';
    }

    if (!config.jwtSecret.trim()) {
      newErrors.jwtSecret = 'JWT密钥不能为空';
    } else if (config.jwtSecret.length < 16) {
      newErrors.jwtSecret = 'JWT密钥至少16个字符';
    }

    if (!config.databasePath.trim()) {
      newErrors.databasePath = '数据库路径不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请检查表单中的错误');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/init/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('配置保存成功！服务将自动重启...');

        // 等待服务重启
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        toast.error(data.error || '保存配置失败');
      }
    } catch (error: any) {
      toast.error(error.message || '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const generateRandomSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig({ ...config, jwtSecret: secret });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">检查配置状态...</p>
        </div>
      </div>
    );
  }

  if (isConfigured) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 初始化配置
          </h1>
          <p className="text-gray-600 text-lg">
            欢迎使用 AI Service Platform！请完成以下基础配置以开始使用。
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <span>首次部署需要配置，配置信息将保存在服务器上</span>
          </div>
        </div>

        {/* Required Config */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Database className="w-6 h-6 mr-3 text-indigo-600" />
            必需配置
          </h2>

          <div className="space-y-6">
            {/* 智谱API密钥 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                智谱AI API密钥 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.zhipuApiKey}
                onChange={(e) => setConfig({ ...config, zhipuApiKey: e.target.value })}
                placeholder="请输入智谱AI API密钥"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.zhipuApiKey ? 'border-red-500' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              {errors.zhipuApiKey && (
                <p className="mt-1 text-sm text-red-600">{errors.zhipuApiKey}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                获取地址：https://open.bigmodel.cn/
              </p>
            </div>

            {/* JWT密钥 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                JWT密钥 <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="password"
                    value={config.jwtSecret}
                    onChange={(e) => setConfig({ ...config, jwtSecret: e.target.value })}
                    placeholder="请输入JWT密钥（至少16个字符）"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.jwtSecret ? 'border-red-500' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.jwtSecret && (
                    <p className="mt-1 text-sm text-red-600">{errors.jwtSecret}</p>
                  )}
                </div>
                <button
                  onClick={generateRandomSecret}
                  className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors font-medium whitespace-nowrap"
                >
                  随机生成
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                用于加密用户令牌，请妥善保管
              </p>
            </div>

            {/* 数据库路径 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                数据库路径 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.databasePath}
                onChange={(e) => setConfig({ ...config, databasePath: e.target.value })}
                placeholder="数据库文件存储路径"
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.databasePath ? 'border-red-500' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              {errors.databasePath && (
                <p className="mt-1 text-sm text-red-600">{errors.databasePath}</p>
              )}
            </div>

            {/* Redis配置 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Redis主机
                </label>
                <input
                  type="text"
                  value={config.redisHost}
                  onChange={(e) => setConfig({ ...config, redisHost: e.target.value })}
                  placeholder="localhost"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Redis端口
                </label>
                <input
                  type="text"
                  value={config.redisPort}
                  onChange={(e) => setConfig({ ...config, redisPort: e.target.value })}
                  placeholder="6379"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Config */}
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Mail className="w-6 h-6 mr-3 text-indigo-600" />
            可选配置
          </h2>

          <div className="space-y-6">
            {/* 邮件配置 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                邮件配置
              </label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SMTP服务器</label>
                  <input
                    type="text"
                    value={config.emailHost}
                    onChange={(e) => setConfig({ ...config, emailHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">端口</label>
                  <input
                    type="text"
                    value={config.emailPort}
                    onChange={(e) => setConfig({ ...config, emailPort: e.target.value })}
                    placeholder="587"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">用户名</label>
                  <input
                    type="text"
                    value={config.emailUser}
                    onChange={(e) => setConfig({ ...config, emailUser: e.target.value })}
                    placeholder="your_email@gmail.com"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">密码/应用专用密码</label>
                  <input
                    type="password"
                    value={config.emailPassword}
                    onChange={(e) => setConfig({ ...config, emailPassword: e.target.value })}
                    placeholder="your_app_password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-1">发件人邮箱</label>
                <input
                  type="text"
                  value={config.emailFrom}
                  onChange={(e) => setConfig({ ...config, emailFrom: e.target.value })}
                  placeholder="noreply@yourdomain.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 支付配置 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                支付配置
              </label>

              {/* 微信支付 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">微信支付</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">AppID</label>
                    <input
                      type="text"
                      value={config.wechatAppid}
                      onChange={(e) => setConfig({ ...config, wechatAppid: e.target.value })}
                      placeholder="wx1234567890abcdef"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">商户号</label>
                    <input
                      type="text"
                      value={config.wechatMchid}
                      onChange={(e) => setConfig({ ...config, wechatMchid: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">序列号</label>
                    <input
                      type="text"
                      value={config.wechatSerialNo}
                      onChange={(e) => setConfig({ ...config, wechatSerialNo: e.target.value })}
                      placeholder="1234567890ABCDEF"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">私钥</label>
                    <textarea
                      value={config.wechatPrivateKey}
                      onChange={(e) => setConfig({ ...config, wechatPrivateKey: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 支付宝 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">支付宝</h3>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">AppID</label>
                    <input
                      type="text"
                      value={config.alipayAppid}
                      onChange={(e) => setConfig({ ...config, alipayAppid: e.target.value })}
                      placeholder="2021001234567890"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">应用私钥</label>
                    <textarea
                      value={config.alipayPrivateKey}
                      onChange={(e) => setConfig({ ...config, alipayPrivateKey: e.target.value })}
                      placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">支付宝公钥</label>
                    <textarea
                      value={config.alipayPublicKey}
                      onChange={(e) => setConfig({ ...config, alipayPublicKey: e.target.value })}
                      placeholder="-----BEGIN PUBLIC KEY-----..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              💡 <strong>提示：</strong> 支付和邮件配置可以稍后在管理后台的"系统设置"页面中配置。
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm('确定要跳过配置吗？系统将使用默认配置启动。')) {
                handleSave();
              }
            }}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            使用默认配置
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary px-8 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>保存并重启...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>保存配置</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitConfig;
