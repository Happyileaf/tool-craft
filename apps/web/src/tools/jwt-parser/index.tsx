'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Copy, Key } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  DEFAULT_SAMPLE_INPUT,
  JwtModeEnum,
  JwtAlgorithmEnum,
  AlgorithmOptions,
} from './constants';
import { parseJwt, generateJwt, verifySignature, formatJson } from './utils/jwt';

/**
 * JWT 解析/生成工具，支持解析已有 Token，查看 Header/Payload，验证签名，
 * 也能根据自定义 Header 和 Payload 生成新的 JWT Token，全部运算本地完成。
 * @returns JWT 工具界面
 */
function JwtParser() {
  const { t } = useI18n();
  const [mode, setMode] = useState<JwtModeEnum>(JwtModeEnum.PARSE);
  const [token, setToken] = useState('');
  const [headerJson, setHeaderJson] = useState(
    formatJson({ alg: 'HS256', typ: 'JWT' }),
  );
  const [payloadJson, setPayloadJson] = useState(
    formatJson({
      sub: 'user123',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<JwtAlgorithmEnum>(
    JwtAlgorithmEnum.HS256,
  );
  const [generatedToken, setGeneratedToken] = useState('');
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseJwt>>(
    parseJwt(''),
  );
  const [isCopied, setIsCopied] = useState(false);

  // 解析模式 - 当 token 变化时重新解析
  useEffect(() => {
    if (mode !== JwtModeEnum.PARSE || !token) {
      setParseResult(parseJwt(''));
      return;
    }
    const result = parseJwt(token);
    setParseResult(result);
  }, [mode, token]);

  // 生成模式 - 当输入变化时重新生成
  const regenerate = useCallback(async () => {
    if (mode !== JwtModeEnum.GENERATE) return;

    try {
      const header = JSON.parse(headerJson);
      const payload = JSON.parse(payloadJson);
      const jwt = await generateJwt(header, payload, secret, algorithm);
      setGeneratedToken(jwt);
    } catch (e) {
      setGeneratedToken('');
    }
  }, [mode, headerJson, payloadJson, secret, algorithm]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const handleCopy = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setMode(JwtModeEnum.PARSE)}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            mode === JwtModeEnum.PARSE
              ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {t('tools.jwt-parser.parseMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode(JwtModeEnum.GENERATE)}
          className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            mode === JwtModeEnum.GENERATE
              ? 'bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {t('tools.jwt-parser.generateMode')}
        </button>
      </div>

      {mode === JwtModeEnum.PARSE ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Key className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {t('tools.jwt-parser.tokenLabel')}
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('tools.jwt-parser.tokenPlaceholder')}
            spellCheck={false}
            className="h-20 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
          />

          {token.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {t('tools.jwt-parser.secretLabel')}:
                </label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={t('tools.jwt-parser.secretPlaceholder')}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
                />
              </div>

              {parseResult.isValidFormat ? (
                <>
                  <div className="flex flex-col gap-2 rounded-lg bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Header
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        alg: {parseResult.header?.alg}
                      </span>
                    </div>
                    <pre className="overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {formatJson(parseResult.header)}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg bg-white p-3 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Payload
                      </span>
                      {parseResult.payload?.exp && (
                        <span
                          className={`text-xs ${
                            Date.now() / 1000 > parseResult.payload.exp
                              ? 'text-rose-500 dark:text-rose-400'
                              : 'text-emerald-500 dark:text-emerald-400'
                          }`}
                        >
                          {Date.now() / 1000 > parseResult.payload.exp
                            ? t('tools.jwt-parser.expired')
                            : t('tools.jwt-parser.notExpired')}
                        </span>
                      )}
                    </div>
                    <pre className="overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {formatJson(parseResult.payload)}
                    </pre>
                  </div>
                  {secret && (
                    <div
                      className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                        parseResult.signatureValid === true
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : parseResult.signatureValid === false
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : ''
                      }`}
                    >
                      {parseResult.signatureValid === true ? (
                        <>
                          <Check className="h-4 w-4" />
                          {t('tools.jwt-parser.signatureValid')}
                        </>
                      ) : parseResult.signatureValid === false ? (
                        <>
                          <Check className="h-4 w-4" />
                          {t('tools.jwt-parser.signatureInvalid')}
                        </>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                  {parseResult.error}
                </div>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('tools.jwt-parser.localNotice')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('tools.jwt-parser.algorithmLabel')}:
            </label>
            <select
              value={algorithm}
              onChange={(e) =>
                setAlgorithm(e.target.value as JwtAlgorithmEnum)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 sm:text-sm"
            >
              {AlgorithmOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Header (JSON):
            </label>
            <textarea
              value={headerJson}
              onChange={(e) => setHeaderJson(e.target.value)}
              spellCheck={false}
              className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payload (JSON):
            </label>
            <textarea
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              spellCheck={false}
              className="h-32 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('tools.jwt-parser.secretLabel')}:
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t('tools.jwt-parser.secretGeneratePlaceholder')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 sm:text-sm"
            />
          </div>

          {generatedToken && (
            <div className="mt-2 flex flex-col gap-2 rounded-lg bg-white p-3 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('tools.jwt-parser.generatedLabel')}:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(generatedToken)}
                  disabled={!generatedToken}
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t('common.copySuccess')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{t('common.copy')}</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-auto break-all rounded bg-slate-50 p-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {generatedToken}
              </pre>
            </div>
          )}
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t('tools.jwt-parser.localNotice')}
          </p>
        </div>
      )}
    </div>
  );
}

export default JwtParser;
