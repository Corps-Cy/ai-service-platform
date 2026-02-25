import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { MessageSquare, Loader2, Copy } from 'lucide-react';

const TextGenerate: React.FC = () => {
  const [model, setModel] = useState('glm-4');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入内容');
      return;
    }

    setLoading(true);

    const newMessages = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);

    try {
      const response = await apiService.createTextTask(model, newMessages);
      const content = response.data.result.choices[0].message.content;
      setResult(content);
      setMessages([...newMessages, { role: 'assistant', content }]);
      toast.success('生成成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '生成失败');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('已复制到剪贴板');
  };

  const handleClear = () => {
    setMessages([]);
    setResult('');
    setPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">文本生成</h1>

      <div className="space-y-6">
        {/* 设置 */}
        <div className="card">
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              模型
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input"
            >
              <option value="glm-4">GLM-4（推荐）</option>
              <option value="glm-3-turbo">GLM-3 Turbo</option>
              <option value="glm-4v">GLM-4V（多模态）</option>
            </select>
          </div>
        </div>

        {/* 输入 */}
        <div className="card">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              输入内容
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="input"
              placeholder="输入你想要生成的内容，例如：写一篇关于人工智能的文章..."
            />
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  生成
                </>
              )}
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="btn btn-secondary"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {/* 结果 */}
        {result && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">生成结果</h2>
              <button
                onClick={handleCopy}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>复制</span>
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {result}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 用途：文章写作、翻译、摘要、问答等 | 消耗：约100 tokens/次
        </p>
      </div>
    </div>
  );
};

export default TextGenerate;
