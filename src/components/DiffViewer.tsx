import { useMemo } from 'react';
import { diffLines } from 'diff';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  maxHeight?: string;
}

/** GitHub-style diff viewer — green for added lines, red for removed. */
export default function DiffViewer({ oldCode, newCode, maxHeight = '500px' }: DiffViewerProps) {
  const diff = useMemo(() => diffLines(oldCode, newCode), [oldCode, newCode]);

  let lineNumOld = 1;
  let lineNumNew = 1;

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-bg-input">
      <div className="border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Diff</span>
      </div>
      <div className="overflow-auto font-mono text-xs leading-relaxed" style={{ maxHeight }}>
        {diff.map((part, i) => {
          const lines = part.value.split('\n');
          if (lines[lines.length - 1] === '') lines.pop();
          return lines.map((line, j) => {
            const isAdded = part.added;
            const isRemoved = part.removed;
            const bg = isAdded ? 'bg-success/10' : isRemoved ? 'bg-danger/10' : '';
            const textColor = isAdded ? 'text-success' : isRemoved ? 'text-danger' : 'text-slate-400';
            const prefix = isAdded ? '+' : isRemoved ? '-' : ' ';
            const oldNum = isRemoved ? lineNumOld : '';
            const newNum = isAdded ? lineNumNew : isRemoved ? '' : lineNumNew;

            if (!isRemoved) lineNumNew++;
            if (!isAdded) lineNumOld++;

            return (
              <div key={`${i}-${j}`} className={`flex ${bg}`}>
                <span className="w-10 shrink-0 select-none border-r border-white/5 px-2 text-right text-slate-700">{oldNum}</span>
                <span className="w-10 shrink-0 select-none border-r border-white/5 px-2 text-right text-slate-700">{newNum}</span>
                <span className={`shrink-0 px-1 ${textColor}`}>{prefix}</span>
                <span className={`px-2 ${textColor}`} style={{ whiteSpace: 'pre' }}>{line}</span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
