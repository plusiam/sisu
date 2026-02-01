import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Link, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTeacherStore } from '../../stores/teacherStore';
import { GoogleSheetsAPI } from '../../lib/googleSheetsApi';

interface GoogleSheetsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleSheetsSettingsModal({ isOpen, onClose }: GoogleSheetsSettingsModalProps) {
  const { googleSheetsConfig, updateGoogleSheetsConfig } = useTeacherStore();

  const [formData, setFormData] = useState({
    spreadsheetId: googleSheetsConfig.spreadsheetId,
    webAppUrl: googleSheetsConfig.webAppUrl,
    enabled: googleSheetsConfig.enabled,
    autoSync: googleSheetsConfig.autoSync,
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTest = async () => {
    if (!formData.webAppUrl) {
      setTestStatus('error');
      setTestMessage('Web App URL을 입력하세요');
      return;
    }

    setTestStatus('testing');
    setTestMessage('연결 테스트 중...');

    try {
      const api = new GoogleSheetsAPI(formData.webAppUrl);
      const success = await api.testConnection();

      if (success) {
        setTestStatus('success');
        setTestMessage('연결 성공!');
      } else {
        setTestStatus('error');
        setTestMessage('연결 실패');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : '연결 실패');
    }
  };

  const handleSave = () => {
    updateGoogleSheetsConfig(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Google Sheets 설정
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              설정 방법
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Google Sheets를 엽니다</li>
              <li>확장 프로그램 &gt; Apps Script를 클릭합니다</li>
              <li>프로젝트 폴더의 Code.gs 파일 내용을 복사하여 붙여넣습니다</li>
              <li>배포 &gt; 새 배포를 클릭합니다</li>
              <li>유형: 웹 앱, 액세스 권한: "누구나"로 설정합니다</li>
              <li>배포 후 Web App URL을 아래에 붙여넣습니다</li>
            </ol>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Spreadsheet ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Spreadsheet ID (선택사항)
              </label>
              <input
                type="text"
                value={formData.spreadsheetId}
                onChange={(e) => setFormData(prev => ({ ...prev, spreadsheetId: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1ABC...XYZ (URL의 /d/ 다음 부분)"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                참고용입니다. Web App URL만 있으면 작동합니다.
              </p>
            </div>

            {/* Web App URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Web App URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.webAppUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, webAppUrl: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                         bg-white dark:bg-slate-800 text-slate-800 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://script.google.com/macros/s/..."
              />
            </div>

            {/* Test Connection */}
            <div>
              <button
                onClick={handleTest}
                disabled={testStatus === 'testing' || !formData.webAppUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                         border border-slate-300 dark:border-slate-600
                         text-slate-700 dark:text-slate-300
                         hover:bg-slate-100 dark:hover:bg-slate-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
              >
                {testStatus === 'testing' && <Loader className="w-4 h-4 animate-spin" />}
                {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                {testStatus === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                {testStatus === 'idle' && <Link className="w-4 h-4" />}
                연결 테스트
              </button>
              {testMessage && (
                <p className={`text-sm mt-2 ${
                  testStatus === 'success' ? 'text-green-600 dark:text-green-400' :
                  testStatus === 'error' ? 'text-red-600 dark:text-red-400' :
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {testMessage}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Google Sheets 동기화 활성화
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSync}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoSync: e.target.checked }))}
                  disabled={!formData.enabled}
                  className="w-4 h-4 text-indigo-600 rounded disabled:opacity-50"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  변경 사항 자동 동기화 (실험적)
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600
                       text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700
                       transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.webAppUrl}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700
                       text-white font-medium flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              <Save className="w-4 h-4" />
              저장
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
