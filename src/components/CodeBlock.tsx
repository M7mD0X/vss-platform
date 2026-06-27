import { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';
import 'prismjs/themes/prism-tomorrow.css';

interface CodeBlockProps {
  code: string;
  editable?: boolean;
  onChange?: (code: string) => void;
  language?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
}

/** Syntax-highlighted code viewer/editor using Prism.js (Lua/Luau support). */
export default function CodeBlock({ code, editable, onChange, language = 'lua', maxHeight = '500px', showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) Prism.highlightElement(preRef.current);
  }, [code]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  };

  const lines = code.split('\n');

  if (editable) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-bg-input">
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Lua</span>
          <span className="text-[10px] text-slate-600">{code.length.toLocaleString()} chars</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-300 outline-none"
          style={{ minHeight: '300px', maxHeight }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-bg-input">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">{language}</span>
        <button onClick={handleCopy} className={`text-[10px] font-semibold transition-colors ${copied ? 'text-success' : 'text-slate-500 hover:text-slate-300'}`}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        {showLineNumbers ? (
          <div className="flex">
            <div className="select-none border-r border-white/5 px-3 py-4 text-right font-mono text-xs text-slate-700">
              {lines.map((_, i) => <div key={i} style={{ lineHeight: '1.5' }}>{i + 1}</div>)}
            </div>
            <pre ref={preRef} className="flex-1 p-4 font-mono text-xs leading-relaxed" style={{ margin: 0 }}>
              <code className={`language-${language}`}>{code}</code>
            </pre>
          </div>
        ) : (
          <pre ref={preRef} className="p-4 font-mono text-xs leading-relaxed" style={{ margin: 0 }}>
            <code className={`language-${language}`}>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
