import React, { useState } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { Table, Loader2, Download } from 'lucide-react';

const ExcelProcess: React.FC = () => {
  const [instruction, setInstruction] = useState('');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const examples = [
    '生成一个销售数据表格，包含产品名称、销售额、利润率',
    '分析这组数据，计算平均值、总和、最大值',
    '创建一个项目进度表，包含任务、开始日期、结束日期、负责人',
  ];

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      toast.error('请输入操作指令');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const parsedData = data.trim() ? JSON.parse(data) : undefined;
      const response = await apiService.createExcelTask(instruction, parsedData);
      const content = response.data.result.choices[0].message.content;
      setResult(content);
      toast.success('处理成功');
    } catch (error: any) {
      toast.error(error.response?.data?.error || '处理失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    try {
      // 简化处理，实际应使用xlsx库生成Excel文件
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `excel-data-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('已下载');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Excel操作</h1>

      <div className="space-y-6">
        <div className="card">
          <div className="space-y-4">
            <div>
              <label htmlFor="instruction" className="block text-sm font-medium text-gray-700 mb-2">
                操作指令
              </label>
              <textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={3}
                className="input"
                placeholder="描述你想要的Excel操作..."
              />
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">快速选择：</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    onClick={() => setInstruction(example)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-2">
                现有数据（可选，JSON格式）
              </label>
              <textarea
                id="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={4}
                className="input font-mono text-sm"
                placeholder='[{"name": "产品A", "sales": 1000, "profit": 0.2}, ...]'
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
                  <Table className="w-5 h-5 mr-2" />
                  生成Excel
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
                onClick={handleDownload}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>下载</span>
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {result}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 支持生成、分析、转换Excel数据 | 消耗：200 tokens/次
        </p>
      </div>
    </div>
  );
};

export default ExcelProcess;
