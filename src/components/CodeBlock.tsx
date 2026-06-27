import { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-lua';

interface CodeBlockProps {
  code: string;
  editable?: boolean;
  onChange?: (code: string) => void;
  language?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
}

/**
 * Syntax-highlighted code viewer/editor using Prism.js (Lua support).
 * Uses a custom dark theme that matches the app's bg-input color —
 * overrides Prism's default theme backgrounds so the source viewer,
 * upload editor, and diff viewer all share the same dark look.
 */
export default function CodeBlock({ code, editable, onChange, language = 'lua', maxHeight = '500px', showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  // Re-highlight whenever code changes
  useEffect(() => {
    if (codeRef.current && !editable) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, editable]);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* */ }
  };

  const lines = code.split('\n');

  // Editable mode — plain textarea (no highlighting while editing, but
  // matches the same dark background as the read-only view)
  if (editable) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#14141a]">
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Lua</span>
          <span className="text-[10px] text-slate-600">{code.length.toLocaleString()} chars</span>
        </div>
        <textarea
          value={code}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-[#14141a] p-4 font-mono text-xs leading-relaxed text-slate-300 outline-none"
          style={{ minHeight: '300px', maxHeight }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    );
  }

  // Read-only mode — syntax highlighted
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#14141a]">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">{language}</span>
        <button onClick={handleCopy} className={`text-[10px] font-semibold transition-colors ${copied ? 'text-success' : 'text-slate-500 hover:text-slate-300'}`}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        {showLineNumbers ? (
          <div className="flex">
            <div className="select-none border-r border-white/5 px-3 py-4 text-right font-mono text-xs text-slate-700" style={{ lineHeight: '1.5' }}>
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <pre className="flex-1 m-0 p-4" style={{ background: 'transparent', margin: 0 }}>
              <code ref={codeRef} className={`language-${language}`} style={{ background: 'transparent', textShadow: 'none', color: '#cbd5e1' }}>
                {code}
              </code>
            </pre>
          </div>
        ) : (
          <pre className="m-0 p-4" style={{ background: 'transparent', margin: 0 }}>
            <code ref={codeRef} className={`language-${language}`} style={{ background: 'transparent', textShadow: 'none', color: '#cbd5e1' }}>
              {code}
            </code>
          </pre>
        )}
      </div>

      {/* Custom Prism token colors — inline so they override the default theme */}
      <style>{`
        .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #64748b; font-style: italic; }
        .token.punctuation { color: #94a3b8; }
        .token.keyword { color: #818cf8; font-weight: 600; }
        .token.boolean, .token.number { color: #f472b6; }
        .token.string { color: #4ade80; }
        .token.function { color: #22d3ee; }
        .token.operator { color: #94a3b8; }
        .token.entity, .token.url, .token.symbol, .token.variable { color: #f59e0b; }
        .token.constant { color: #fb923c; }
        .token.property { color: #a78bfa; }
        .token.tag { color: #ef4444; }
        .token.important { color: #ef4444; font-weight: 700; }
        pre[class*="language-"], code[class*="language-"] {
          background: transparent !important;
          text-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
