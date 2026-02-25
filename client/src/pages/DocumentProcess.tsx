import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Upload, Loader2, CheckCircle, Download, FileText, Trash2, Copy } from 'lucide-react';

const DocumentProcess: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [task, setTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileTypes = [
    { id: 'extract', name: '内容提取', icon: <FileText className="w-5 h-5" />, description: '提取PDF/文档中的文字内容' },
    { id: 'summarize', name: '文档摘要', icon: <FileText className="w-5 h-5" />, description: '生成文档的核心要点摘要' },
    { id: 'translate', name: '文档翻译', icon: <FileText className="w-5 h-5" />, description: '将文档翻译成其他语言' },
    { id: 'format', name: '格式化', icon: <FileText className="w-5 h-5" />, description: '优化文档格式、排版' },
    { id: 'analyze', name: '内容分析', icon: <FileText className="w-5 h-5" />, description: '深度分析文档结构和内容' },
    { id: 'qa', name: '问答', icon: <FileText className="w-5 h-5" />, description: '基于文档内容回答问题' },
  ];

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('仅支持PDF、Word、TXT格式');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      toast.error('文件大小不能超过10MB');
      return;
    }

    setFile(selectedFile);
    setProcessing(false);
    setResult(null);
  };

  const handleProcess = async () => {
    if (!file || !task) {
      toast.error('请选择文件和处理任务');
      return;
    }

    setLoading(true);
    setProcessing(true);
    setResult(null);

    try {
      const response = await apiService.createTask({
        type: 'document_process',
        input: JSON.stringify({
          task,
          content: '[FILE]', // 占位符，实际文件在上传后由后端处理
          fileName: file.name,
          fileSize: file.size
        })
      });

      const taskId = response.data.taskId;

      // 轮询任务状态
      const interval = setInterval(async () => {
        const taskResponse = await apiService.getTask(taskId);

        if (taskResponse.data.task.status === 'completed') {
          clearInterval(interval);
          setResult(taskResponse.data.task.output);
          setProcessing(false);
          setLoading(false);
          toast.success('文档处理完成');
        } else if (taskResponse.data.task.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          setLoading(false);
          toast.error(taskResponse.data.task.error || '文档处理失败');
        }
      }, 2000);

      // 60秒超时
      setTimeout(() => {
        clearInterval(interval);
        setProcessing(false);
        setLoading(false);
        toast.error('处理超时，请稍后再试');
      }, 60000);
    } catch (error: any) {
      setLoading(false);
      setProcessing(false);
      toast.error(error.response?.data?.error || '文档处理失败');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    
    const blob = new Blob([typeof result === 'string' ? result : JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-result-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('结果已复制到剪贴板');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-[#F5F3FF] px-4 py-2 rounded-full mb-4">
          <FileText className="w-5 h-5 text-[#6366F1]" />
          <span className="text-[#6366F1] font-semibold">AI 文档处理</span>
        </div>
        <h1 className="text-4xl font-bold text-[#1E1B4B] mb-4">
          AI文档处理
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          使用AI提取、摘要、翻译、分析PDF/Word文档
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：文件上传和任务选择 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 文件上传卡片 */}
          <div className="card">
            <h2 className="text-xl font-bold text-[#1E1B4B] mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-[#6366F1]" />
              上传文档
            </h2>

            <div
              className="border-2 border-dashed border-[#6366F1]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[#6366F1]/60 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
              />
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <FileText className="w-12 h-12 text-[#10B981] mx-auto mb-4" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-4 w-full btn btn-ghost text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    移除文件
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">拖拽PDF/Word文件到此处，或</p>
                  <label className="btn btn-secondary inline-flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    选择文件
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) handleFileSelect(selectedFile);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 限制说明 */}
            <div className="mt-4 p-4 bg-[#F5F3FF]/50 rounded-xl">
              <p className="text-sm text-[#6366F1]">
                <strong>⚠️ 文件限制：</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                  最大10MB
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 text-center text-[#10B981] mr-2">✓</span>
                  PDF/Word/TXT格式
                </li>
              </ul>
            </div>
          </div>

          {/* 任务选择卡片 */}
          <div className="card">
            <h2 className="text-xl font-bold text-[#1E1B4B] mb-6">
              选择处理任务
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {fileTypes.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTask(item.id)}
                  className={`card p-4 text-left cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                    task === item.id ? 'ring-2 ring-[#6366F1]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="bg-[#F5F3FF] p-2 rounded-lg">
                      {item.icon}
                    </div>
                    <span className="font-semibold text-gray-800">{item.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                </button>
              ))}
            </div>

            {/* 处理按钮 */}
            <button
              onClick={handleProcess}
              disabled={!file || !task || processing}
              className={`btn btn-primary w-full flex items-center justify-center ${
                processing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  开始处理
                </>
              )}
            </button>
          </div>
        </div>

        {/* 中间：处理进度 */}
        {processing && (
          <div className="lg:col-span-1">
            <div className="card h-full flex flex-col items-center justify-center p-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-[#6366F1] animate-pulse" />
                </div>
              </div>
              <p className="mt-6 text-gray-600">AI正在处理您的文档...</p>
              <div className="typing-indicator justify-center">
                <span className="typing-dot bg-[#6366F1]"></span>
                <span className="typing-dot bg-[#6366F1]"></span>
                <span className="typing-dot bg-[#6366F1]"></span>
              </div>
            </div>
          </div>
        )}

        {/* 右侧：结果展示 */}
        {result && !processing && (
          <div className="lg:col-span-2 card animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1E1B4B]">
                处理结果
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn btn-ghost px-4"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownload}
                  className="btn btn-secondary px-4"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-[#F5F3FF] rounded-xl p-6 border border-[#6366F1]/20">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-[#10B981]/10 rounded-xl">
              <p className="text-sm text-[#10B981]">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                处理完成！结果已自动保存到历史记录
              </p>
            </div>
          </div>
        )}

        {!file && !result && !processing && (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              准备就绪
            </h3>
            <p className="text-gray-600">上传文档并选择处理任务</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentProcess;
