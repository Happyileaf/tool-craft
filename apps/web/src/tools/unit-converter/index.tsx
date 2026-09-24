'use client';

import { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { LanguageEnum } from '@/lib/i18n/constants';
import {
  UNIT_CATEGORIES,
  DEFAULT_INPUT_VALUE,
  DEFAULT_CATEGORY,
  type Unit,
  type UnitCategory,
} from './constants';
import { convert } from './utils/convert';

function UnitConverter() {
  const { t, language } = useI18n();
  const [category, setCategory] = useState<UnitCategory>(DEFAULT_CATEGORY);
  const [inputValue, setInputValue] = useState<number>(DEFAULT_INPUT_VALUE);
  const [fromUnitKey, setFromUnitKey] = useState<string>(
    UNIT_CATEGORIES[0]!.units[0]!.key
  );
  const [toUnitKey, setToUnitKey] = useState<string>(
    UNIT_CATEGORIES[0]!.units[1]!.key
  );

  const currentCategory = UNIT_CATEGORIES.find(c => c.key === category)!;
  const fromUnit = currentCategory.units.find(u => u.key === fromUnitKey)!;
  const toUnit = currentCategory.units.find(u => u.key === toUnitKey)!;
  const result = convert(inputValue || 0, fromUnit, toUnit, category);

  function swapUnits() {
    setFromUnitKey(toUnitKey);
    setToUnitKey(fromUnitKey);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <ArrowDownUp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {t('tools.unit-converter.category')}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UNIT_CATEGORIES.map(cat => {
            const label = language === LanguageEnum.ZH ? cat.label : cat.labelEn;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setCategory(cat.key);
                  // 切换分类后默认选前两个单位
                  const firstUnit = cat.units[0]!.key;
                  const secondUnit = cat.units.length > 1 ? cat.units[1]!.key : firstUnit;
                  setFromUnitKey(firstUnit);
                  setToUnitKey(secondUnit);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  category === cat.key
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.unit-converter.from')}
          </label>
          <input
            type="number"
            step="any"
            value={inputValue}
            onChange={e => setInputValue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500"
          />
          <select
            value={fromUnitKey}
            onChange={e => setFromUnitKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
          >
            {currentCategory.units.map(unit => {
              const label = language === LanguageEnum.ZH ? unit.label : unit.labelEn;
              return (
                <option key={unit.key} value={unit.key}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={swapUnits}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('tools.unit-converter.to')}
          </label>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
            <span className="break-all select-all font-mono text-sm text-slate-700 dark:text-slate-300">
              {result}
            </span>
          </div>
          <select
            value={toUnitKey}
            onChange={e => setToUnitKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
          >
            {currentCategory.units.map(unit => {
              const label = language === LanguageEnum.ZH ? unit.label : unit.labelEn;
              return (
                <option key={unit.key} value={unit.key}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.unit-converter.localNotice')}
      </p>
    </div>
  );
}

export default UnitConverter;
