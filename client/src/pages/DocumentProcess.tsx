import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Loader2, Copy } from 'lucide-react';

const DocumentProcess: React.FC = () => {
  const [content, setContent] = useState('');
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const tasks = [
    '提取关键信息',
    '生成摘要',
    '翻译成英文',
    '翻译成中文',
    '重写/润色',
    '分析情感倾向',
    '生成问答',
  ];

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error('请输入文档内容');
      return;
    }

    if (!task.trim()) {
      toast.error('请选择或输入处理任务');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await apiService.createDocumentTask(content, task);
      const output = response.data.result.choices[0].message.content;
      setResult(output);
      toast.success('处理成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '处理失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">文档处理</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="space-y-4">
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                文档内容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="input"
                placeholder="粘贴文档内容..."
              />
            </div>

            <div>
              <label htmlFor="task" className="block text-sm font-medium text-gray-700 mb-2">
                处理任务
              </label>
              <select
                id="task"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="input"
              >
                <option value="">选择任务...</option>
                {tasks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="customTask" className="block text-sm font-medium text-gray-700 mb-2">
                或输入自定义任务
              </label>
              <input
                id="customTask"
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="input"
                placeholder="例如：提取所有日期和事件"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  处理文档
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">处理结果</h2>
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
          💡 支持PDF/Word/纯文本内容处理 | 消耗：200 tokens/次
        </p>
      </div>
    </div>
  );
};

export default DocumentProcess;
