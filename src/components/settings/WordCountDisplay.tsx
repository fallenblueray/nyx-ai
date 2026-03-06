interface WordCountDisplayProps {
  wordCount: number;
  isFirstPurchase: boolean;
  onRecharge: () => void;
}

export function WordCountDisplay({ wordCount, isFirstPurchase, onRecharge }: WordCountDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">剩餘字數: {wordCount}</span>
      {isFirstPurchase && <span className="text-xs text-green-600">首次購買優惠</span>}
      <button onClick={onRecharge} className="text-sm text-blue-600 hover:underline">
        充值
      </button>
    </div>
  );
}
