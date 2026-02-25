import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Type, Loader2, Sparkles, Send, FileText, Download } from 'lucide-react';

const TextGenerate: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('glm-4');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const messages = [
        { role: 'system', content: '你是一个专业的文本生成助手，擅长写作、翻译、摘要等任务。请直接返回生成结果，不要包含任何额外的解释或元信息。' },
        { role: 'user', content: prompt }
      ];

      const response = await apiService.generateText({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      });
      
      setResult(response.data);
      
      // 添加到历史记录
      setHistory([{
        id: Date.now(),
        prompt,
        result: response.data,
        timestamp: new Date().toISOString()
      }, ...history]);
      
      toast.success('文本生成成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-[#F5F3FF] px-4 py-2 rounded-full mb-4">
          <Type className="w-5 h-5 text-[#6366F1]" />
          <span className="text-[#6366F1] font-semibold">AI 文本生成</span>
        </div>
        <h1 className="text-4xl font-bold text-[#1E1B4B] mb-4">
          文本生成
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          使用GLM-4模型，智能生成高质量文本内容
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：输入表单 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <div className="space-y-6">
              {/* 提示词输入 */}
              <div>
                <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
                  提示词
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={8}
                  className="input resize-none"
                  placeholder="输入您想要生成的内容，例如：写一篇关于人工智能的文章"
                />
              </div>

              {/* 模型选择 */}
              <div>
                <label htmlFor="model" className="block text-sm font-semibold text-gray-700 mb-2">
                  模型选择
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input cursor-pointer"
                >
                  <option value="glm-4">GLM-4 (推荐)</option>
                  <option value="glm-4-flash">GLM-4 Flash</option>
                  <option value="glm-4-long">GLM-4 Long</option>
                  <option value="glm-3-turbo">GLM-3 Turbo</option>
                </select>
              </div>

              {/* 参数调整 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="temperature" className="block text-sm font-semibold text-gray-700 mb-2">
                    温度
                    <span className="text-gray-400 text-xs">({temperature})</span>
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.0 (精确)</span>
                    <span>2.0 (创意)</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="maxTokens" className="block text-sm font-semibold text-gray-700 mb-2">
                    最大Token数
                  </label>
                  <select
                    id="maxTokens"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="input cursor-pointer"
                  >
                    <option value={1000}>1000</option>
                    <option value={2000}>2000 (推荐)</option>
                    <option value={4000}>4000</option>
                    <option value={8000}>8000</option>
                  </select>
                </div>
              </div>

              {/* 生成按钮 */}
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`btn btn-primary w-full flex items-center justify-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    生成文本
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 快捷模板 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 mb-4">快捷模板</h3>
            {[
              { title: '写作助手', prompt: '帮我写一篇关于人工智能的文章' },
              { title: '翻译专家', prompt: '将以下英文翻译成中文：Hello, how are you today?' },
              { title: '摘要生成', prompt: '帮我总结以下内容的关键点' },
            { title: '代码生成', prompt: '用Python写一个快速排序算法' },
            { title: '创意写作', prompt: '写一首关于春天的现代诗' },
            { title: '邮件起草', prompt: '帮我写一封专业的商务邮件' },
            { title: '故事创作', prompt: '写一个关于太空探索的科幻故事' },
            { title: '问答助手', prompt: '回答：什么是量子计算？' },
            { title: '学习笔记', prompt: '帮我整理机器学习的关键概念' },
              { title: '文本润色', prompt: '帮我润色以下段落' },
            { title: '方案建议', prompt: '帮我制定一个学习计划' },
            { title: '产品描述', prompt: '帮我写一个智能手表的产品描述' },
              { title: '营销文案', prompt: '写一个吸引人的产品广告语' },
              { title: '社交媒体', prompt: '写一个有趣的微博/朋友圈内容' },
            { title: '解释说明', prompt: '解释什么是区块链技术' },
              { title: '技术文档', prompt: '帮我写一个API接口的使用文档' },
            { title: '邮件回复', prompt: '帮我回复一封咨询邮件' },
              { title: '演讲稿', prompt: '帮我写一个5分钟的演讲稿' },
              { title: '访谈问题', prompt: '准备10个采访AI专家的问题' },
            { title: '教程编写', prompt: '写一个Python入门教程' },
              { title: '代码注释', prompt: '帮这段代码添加详细注释' },
              { title: '错误修复', prompt: '帮我找出并修复以下代码的错误' },
              { title: '代码优化', prompt: '帮我优化以下代码的性能' },
              { title: '测试用例', prompt: '为这段函数写几个测试用例' },
              { title: '代码重构', prompt: '帮我重构以下代码，使其更易读' },
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => setPrompt(item.prompt)}
                className="card p-4 text-left hover:shadow-md transition-shadow duration-200 group cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-[#F5F3FF] p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <FileText className="w-5 h-5 text-[#6366F1]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1 group-hover:text-[#6366F1] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {item.prompt.substring(0, 50)}...
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：结果展示 + 历史记录 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 生成结果 */}
          {result && result.data && (
            <div className="card animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">生成结果</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(result.data)}
                    className="btn btn-ghost px-4 py-2"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    复制
                  </button>
                </div>
              </div>
              
              <div className="bg-[#F5F3FF] rounded-xl p-6 border border-[#6366F1]/20">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {typeof result.data === 'object' 
                    ? JSON.stringify(result.data, null, 2)
                    : result.data}
                </pre>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">准备就绪</h3>
              <p className="text-gray-600">选择模板或输入提示词开始创作</p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#6366F1] animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-gray-600">AI 正在为您创作...</p>
              <div className="typing-indicator justify-center">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          {/* 历史记录 */}
          {history.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">历史记录</h3>
                <button
                  onClick={() => setHistory([])}
                  className="text-sm text-[#6366F1] hover:underline"
                >
                  清空
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPrompt(item.prompt)}
                    className="p-3 bg-[#F5F3FF] rounded-lg hover:bg-[#6366F1]/10 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 line-clamp-2 group-hover:text-[#6366F1]">
                          {item.prompt}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextGenerate;
