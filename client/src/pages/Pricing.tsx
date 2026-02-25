import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Check, Loader2, X, RefreshCw, Clock } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, pricingRes] = await Promise.all([
        apiService.getPlans(),
        apiService.getPricing()
      ]);
      setPlans(plansRes.data.plans || []);
      setPricing(pricingRes.data.pricing || []);
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
    setOrderStatus('pending');

    try {
      const response = await apiService.createOrder(
        'plan',
        selectedPlan.id,
        selectedPlan.price,
        paymentMethod,
        `购买${selectedPlan.name}套餐`
      );

      setOrderData(response.data);
      setOrderStatus('pending');

      // 开始轮询订单状态
      startOrderPolling(response.data.orderNo);

      toast.success(`订单创建成功！订单号：${response.data.orderNo}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || '创建订单失败');
      setOrderLoading(false);
    }
  };

  const startOrderPolling = (orderNo: string) => {
    setPolling(true);

    const pollOrder = async () => {
      try {
        const response = await apiService.getOrder(orderNo);
        const order = response.data.order;

        if (order.status === 'paid') {
          setOrderStatus('paid');
          setPolling(false);
          toast.success('支付成功！套餐已激活');
          setTimeout(() => {
            setSelectedPlan(null);
            setOrderData(null);
            setOrderLoading(false);
            navigate('/dashboard');
          }, 2000);
        } else if (order.status === 'cancelled' || order.status === 'refunded') {
          setOrderStatus('failed');
          setPolling(false);
          toast.error('订单已取消或退款');
          setOrderLoading(false);
        }
      } catch (error) {
        console.error('Poll order error:', error);
      }
    };

    // 立即查询一次
    pollOrder();

    // 每3秒查询一次
    pollingRef.current = setInterval(pollOrder, 3000);
  };

  const handleCancelOrder = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setPolling(false);
    setSelectedPlan(null);
    setOrderData(null);
    setOrderStatus('pending');
    setOrderLoading(false);
  };

  const handleRefreshOrderStatus = async () => {
    if (!orderData) return;

    try {
      const response = await apiService.getOrder(orderData.orderNo);
      const order = response.data.order;

      if (order.status === 'paid') {
        setOrderStatus('paid');
        setPolling(false);
        toast.success('支付成功！套餐已激活');
        setTimeout(() => {
          setSelectedPlan(null);
          setOrderData(null);
          setOrderLoading(false);
          navigate('/dashboard');
        }, 2000);
      } else if (order.status === 'cancelled' || order.status === 'refunded') {
        setOrderStatus('failed');
        setPolling(false);
        toast.error('订单已取消或退款');
      }
    } catch (error) {
      console.error('Refresh order status error:', error);
      toast.error('刷新订单状态失败');
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            {orderStatus === 'pending' && !orderData ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4">确认支付</h3>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl mb-4">
                  <p className="text-sm text-gray-600 mb-1">套餐</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">¥{selectedPlan.price}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    支付方式
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPaymentMethod('wechat')}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'wechat'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <span className="font-medium text-gray-800">微信支付</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('alipay')}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'alipay'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium text-gray-800">支付宝</span>
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
                        创建订单中...
                      </>
                    ) : (
                      '确认支付'
                    )}
                  </button>
                </div>
              </>
            ) : orderStatus === 'pending' && orderData ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span>扫码支付</span>
                  <span className="text-sm font-normal text-gray-500">
                    {polling && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 animate-spin" />
                        等待支付...
                      </span>
                    )}
                  </span>
                </h3>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl mb-4">
                  <p className="text-sm text-gray-600 mb-1">套餐</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">¥{selectedPlan.price}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  {paymentMethod === 'wechat' && orderData.code_url ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">请使用微信扫码支付</p>
                      <div className="inline-block bg-white p-3 rounded-lg shadow-sm">
                        {/* 这里应该显示二维码，实际项目中使用二维码生成库 */}
                        <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-40 h-40 mx-auto mb-2 flex items-center justify-center border-4 border-gray-300 rounded">
                              <span className="text-xs text-gray-400">二维码</span>
                            </div>
                            <p className="text-xs text-gray-400">{orderData.code_url.substring(0, 30)}...</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        订单号: {orderData.orderNo}
                      </p>
                    </div>
                  ) : paymentMethod === 'alipay' && orderData.qr_code_url ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">请使用支付宝扫码支付</p>
                      <div className="inline-block bg-white p-3 rounded-lg shadow-sm">
                        {/* 这里应该显示二维码，实际项目中使用二维码生成库 */}
                        <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-40 h-40 mx-auto mb-2 flex items-center justify-center border-4 border-gray-300 rounded">
                              <span className="text-xs text-gray-400">二维码</span>
                            </div>
                            <p className="text-xs text-gray-400">{orderData.qr_code_url.substring(0, 30)}...</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        订单号: {orderData.orderNo}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Loader2 className="w-12 h-12 mx-auto animate-spin text-indigo-500 mb-3" />
                      <p className="text-gray-600">加载支付信息中...</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleCancelOrder}
                    className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>取消支付</span>
                  </button>
                  <button
                    onClick={handleRefreshOrderStatus}
                    className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>刷新状态</span>
                  </button>
                </div>
              </>
            ) : orderStatus === 'paid' ? (
              <>
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">支付成功！</h3>
                  <p className="text-gray-600">套餐已激活，正在跳转...</p>
                </div>
              </>
            ) : (
              <>
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">支付失败</h3>
                  <p className="text-gray-600 mb-6">订单已取消或退款</p>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="btn btn-primary"
                  >
                    关闭
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
