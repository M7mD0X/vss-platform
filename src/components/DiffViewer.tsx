import { useMemo } from 'react';
import { diffLines } from 'diff';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  maxHeight?: string;
}

/**
 * GitHub-style split diff viewer — two columns side by side.
 * Left column = old version, right column = new version.
 * Removed lines are red on the left, added lines are green on the right.
 * Unchanged lines appear on both sides.
 */
export default function DiffViewer({ oldCode, newCode, maxHeight = '500px' }: DiffViewerProps) {
  const { leftLines, rightLines } = useMemo(() => {
    const diff = diffLines(oldCode, newCode);
    const left: { num: number; text: string; type: 'same' | 'removed' }[] = [];
    const right: { num: number; text: string; type: 'same' | 'added' }[] = [];
    let leftNum = 1;
    let rightNum = 1;

    for (const part of diff) {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      for (const line of lines) {
        if (part.removed) {
          left.push({ num: leftNum++, text: line, type: 'removed' });
        } else if (part.added) {
          right.push({ num: rightNum++, text: line, type: 'added' });
        } else {
          // Same line — pad the shorter side so they stay aligned
          left.push({ num: leftNum++, text: line, type: 'same' });
          right.push({ num: rightNum++, text: line, type: 'same' });
        }
      }
    }

    // Pad to equal length so both columns have the same height
    while (left.length < right.length) left.push({ num: 0, text: '', type: 'same' });
    while (right.length < left.length) right.push({ num: 0, text: '', type: 'same' });

    return { leftLines: left, rightLines: right };
  }, [oldCode, newCode]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#14141a]">
      <div className="flex border-b border-white/5">
        <div className="flex-1 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-danger/80">Old</div>
        <div className="border-l border-white/5" />
        <div className="flex-1 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-success/80">New</div>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <div className="flex">
          {/* Left column (old) */}
          <div className="flex-1 min-w-0">
            {leftLines.map((line, i) => (
              <div key={i} className={`flex ${line.type === 'removed' ? 'bg-danger/10' : ''}`}>
                <span className="w-10 shrink-0 select-none border-r border-white/5 px-2 text-right font-mono text-[10px] leading-5 text-slate-700">{line.num || ''}</span>
                <span className={`px-2 font-mono text-xs leading-5 whitespace-pre ${line.type === 'removed' ? 'text-danger' : 'text-slate-400'}`}>
                  {line.type === 'removed' ? '- ' : '  '}{line.text}
                </span>
              </div>
            ))}
          </div>
          <div className="border-l border-white/10" />
          {/* Right column (new) */}
          <div className="flex-1 min-w-0">
            {rightLines.map((line, i) => (
              <div key={i} className={`flex ${line.type === 'added' ? 'bg-success/10' : ''}`}>
                <span className="w-10 shrink-0 select-none border-r border-white/5 px-2 text-right font-mono text-[10px] leading-5 text-slate-700">{line.num || ''}</span>
                <span className={`px-2 font-mono text-xs leading-5 whitespace-pre ${line.type === 'added' ? 'text-success' : 'text-slate-400'}`}>
                  {line.type === 'added' ? '+ ' : '  '}{line.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
