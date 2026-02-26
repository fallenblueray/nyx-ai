'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RechargeModal } from '@/components/RechargeModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface WordCountDisplayProps {
  wordCount: number;
  translations: any;
}

const WARNING_THRESHOLD = 1000;

export function WordCountDisplay({
  wordCount,
  translations,
}: WordCountDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(wordCount);

  useEffect(() => {
    setDisplayCount(wordCount);
  }, [wordCount]);

  const isWarning = displayCount < WARNING_THRESHOLD;

  return (
    <div className="space-y-4">
      {/* 字數顯示 */}
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {translations.settings.wordCount.remaining}
        </p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {displayCount.toLocaleString()}
        </p>
      </div>

      {/* 警告提示 */}
      {isWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {translations.settings.wordCount.warning}
          </AlertDescription>
        </Alert>
      )}

      {/* 充值按鈕 */}
      <Button
        onClick={() => setIsOpen(true)}
        variant={isWarning ? 'default' : 'outline'}
        className="w-full"
      >
        {translations.settings.wordCount.recharge}
      </Button>

      {/* 充值 Modal */}
      <RechargeModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        isFirstPurchase={false}
        wordCount={displayCount}
      />
    </div>
  );
}
