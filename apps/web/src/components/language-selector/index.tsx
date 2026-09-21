'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * 界面语言切换下拉控件，支持简体中文与英文
 *
 * @returns 语言切换下拉节点
 */
function LanguageSelector() {
  const { language, languageOptions, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption =
    languageOptions.find((option) => option.value === language) ??
    languageOptions[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="切换语言 / Switch Language"
        aria-label="Language Selector"
        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-200/80 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
        <span className="font-mono text-xs">{currentOption?.shortLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-36 animate-fade-slide rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
            Language / 语言
          </div>
          {languageOptions.map((option) => {
            const isSelected = option.value === language;
            return (
              <button
                key={option.value}
                id={`lang-option-${option.value}`}
                type="button"
                onClick={() => {
                  setLanguage(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-xs transition-colors',
                  isSelected
                    ? 'bg-slate-100 font-bold text-slate-900 dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white',
                )}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-slate-900 dark:text-white" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
