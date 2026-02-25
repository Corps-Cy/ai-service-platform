import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Check, Loader2 } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, pricingRes] = await Promise.all([
        apiService.getPlans(),
        apiService.getPricing()
      ]);
      setPlans(plansRes.data.plans);
      setPricing(pricingRes.data.pricing);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async (plan: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    setSelectedPlan(plan);
  };

  const handleCreateOrder = async () => {
    if (!selectedPlan) return;

    setOrderLoading(true);

    try {
      const response = await apiService.createOrder(
        'plan',
        selectedPlan.id,
        selectedPlan.price,
        paymentMethod
      );

      // 模拟支付流程（实际项目中应跳转到支付页面或显示二维码）
      toast.success(`订单创建成功！订单号：${response.data.orderNo}`);
      toast.info('请在实际项目中集成微信/支付宝支付');

      // 简化处理，自动完成订单
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('模拟支付完成！');
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '创建订单失败');
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">价格方案</h1>
      <p className="text-gray-600 mb-8">选择适合您的方案，开始使用AI服务</p>

      {/* 套餐 */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">会员套餐</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card relative ${
                plan.popular ? 'border-2 border-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    最受欢迎
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-blue-600">¥{plan.price}</span>
                  <span className="text-gray-600 ml-2">
                    /{plan.type === 'monthly' ? '月' : plan.type === 'quarterly' ? '季' : '年'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature: string, fIndex: number) => (
                  <li key={fIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuyPlan(plan)}
                className="btn w-full"
              >
                <CreditCard className="w-4 h-4 mr-2 inline" />
                购买
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 单项服务 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">单项服务</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricing.map((item, index) => (
            <div key={index} className="card">
              <h3 className="font-bold text-gray-900 mb-1">{item.service}</h3>
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              <p className="text-2xl font-bold text-blue-600">¥{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 支付弹窗 */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">确认支付</h3>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">套餐</p>
              <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">¥{selectedPlan.price}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                支付方式
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`flex-1 p-3 rounded-lg border-2 ${
                    paymentMethod === 'wechat'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">微信支付</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`flex-1 p-3 rounded-lg border-2 ${
                    paymentMethod === 'alipay'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-medium">支付宝</span>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedPlan(null)}
                className="btn btn-secondary flex-1"
                disabled={orderLoading}
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                className="btn btn-primary flex-1"
                disabled={orderLoading}
              >
                {orderLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认支付'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
