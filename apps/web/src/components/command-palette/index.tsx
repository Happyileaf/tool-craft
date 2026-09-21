'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import ToolIcon from '@/components/tool-icon';
import { COMMAND_PALETTE_OPEN_EVENT } from '@/lib/command-palette';
import { useI18n } from '@/lib/i18n';
import { tools } from '@/tools/registry';
import type { ToolMeta } from '@/tools/types';

/**
 * 全局命令面板，通过 ⌘K / Ctrl+K 或顶部搜索入口呼出，支持键盘导航直达工具
 *
 * @returns 命令面板节点；关闭状态下返回 null
 */
function CommandPalette() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEnglish = language === 'en';

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusTimer);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    if (!keyword) return tools;
    return tools.filter((tool) =>
      [
        tool.slug,
        tool.name,
        tool.nameEn,
        tool.description,
        tool.descriptionEn,
        ...tool.tags,
        ...tool.tagsEn,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [query]);

  const selectTool = (tool: ToolMeta) => {
    router.push(tool.path);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(
          (prev) => (prev + 1) % Math.max(1, filteredTools.length),
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredTools.length) % Math.max(1, filteredTools.length),
        );
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selectedTool = filteredTools[selectedIndex];
        if (selectedTool) {
          selectTool(selectedTool);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 px-4 pt-16 backdrop-blur-sm sm:pt-24"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-5 w-5 shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('palette.placeholder')}
            className="flex-1 border-0 bg-transparent px-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 sm:text-base dark:text-white dark:placeholder:text-slate-500"
          />
          <div className="flex shrink-0 items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                title={t('hub.clearSearch')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-400 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              {t('palette.closeHint')}
            </kbd>
            <button
              type="button"
              id="close-command-palette-btn"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Close"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/80">
          {filteredTools.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 sm:text-sm dark:text-slate-500">
              {t('palette.noMatches')}
            </div>
          ) : (
            filteredTools.map((tool, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => selectTool(tool)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                      : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                        isSelected
                          ? 'border-slate-300 bg-white text-slate-900 shadow-xs dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                          : 'border-slate-200 bg-slate-100/80 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <ToolIcon name={tool.iconName} className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {isEnglish ? tool.nameEn : tool.name}
                        </span>
                        <span className="hidden font-mono text-[11px] text-slate-400 sm:inline dark:text-slate-500">
                          {isEnglish ? tool.name : tool.nameEn}
                        </span>
                      </div>
                      <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {isEnglish ? tool.descriptionEn : tool.description}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {isEnglish
                        ? (tool.tagsEn[0] ?? tool.tags[0])
                        : (tool.tags[0] ?? tool.tagsEn[0])}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">
                      ↵
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span>{t('palette.navHint')}</span>
            <span>{t('palette.selectHint')}</span>
          </div>
          <span>
            {t('hub.filteredTools', { count: filteredTools.length })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
