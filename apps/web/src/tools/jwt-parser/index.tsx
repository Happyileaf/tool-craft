'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ShieldCheck,
  Split,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Mode, Algorithm, AlgorithmLabels } from './constants';
import {
  parseJWT,
  generateJWT,
  verifySignature,
  tryParseJSON,
  JwtErrorKey,
  type JwtOperationError,
} from './utils/jwt';

const DEFAULT_HEADER = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);
function createDefaultPayload() {
  return JSON.stringify(
    {
      sub: '1234567890',
      name: 'John Doe',
      iat: Math.floor(Date.now() / 1000),
    },
    null,
    2,
  );
}

/**
 * JWT 生成器/解析器，支持解析已有的 JWT，查看 Header 和 Payload，验证签名，也可以生成新的 JWT。
 * 所有运算在浏览器本地完成，不泄露密钥。
 *
 * @returns JWT 生成器/解析器交互界面
 */
function JWTParser() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(Mode.PARSE);
  const [token, setToken] = useState('');
  const [headerStr, setHeaderStr] = useState(DEFAULT_HEADER);
  const [payloadStr, setPayloadStr] = useState(createDefaultPayload);
  const [parts, setParts] = useState<{
    header: string;
    payload: string;
    signature: string;
  }>({
    header: '',
    payload: '',
    signature: '',
  });
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.HS256);
  const [generatedToken, setGeneratedToken] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState<JwtOperationError | null>(null);
  const [jsonError, setJsonError] = useState<JwtOperationError | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPart, setCopiedPart] = useState<'header' | 'payload' | 'signature' | null>(null);

  useEffect(() => {
    if (mode !== Mode.PARSE) return;

    const trimmedToken = token.trim();
    const result = parseJWT(trimmedToken);
    setIsValidFormat(result.isValidFormat);
    if (result.isValidFormat) {
      const tokenParts = trimmedToken.split('.');
      setParts({
        header: tokenParts[0] ?? '',
        payload: tokenParts[1] ?? '',
        signature: tokenParts[2] ?? '',
      });
      setHeaderStr(JSON.stringify(result.header, null, 2));
      setPayloadStr(JSON.stringify(result.payload, null, 2));
    } else {
      setParts({ header: '', payload: '', signature: '' });
    }
    setIsSignatureValid(null);
    setVerifyError(null);
  }, [token, mode]);

  useEffect(() => {
    async function doVerify() {
      if (!isValidFormat || !secret) {
        setIsSignatureValid(null);
        return;
      }

      const parts = token.trim().split('.');
      if (parts.length !== 3) return;

      const result = await verifySignature(
        parts[0]!,
        parts[1]!,
        parts[2]!,
        secret,
        algorithm,
      );
      setIsSignatureValid(result.valid);
      setVerifyError(result.error ?? null);
    }

    doVerify();
  }, [token, secret, isValidFormat, algorithm]);

  async function handleGenerate() {
    setJsonError(null);

    const header = tryParseJSON(headerStr);
    const payload = tryParseJSON(payloadStr);

    if (!header) {
      setJsonError({ key: JwtErrorKey.INVALID_HEADER_JSON });
      return;
    }
    if (!payload) {
      setJsonError({ key: JwtErrorKey.INVALID_PAYLOAD_JSON });
      return;
    }
    if (!secret) {
      setJsonError({ key: JwtErrorKey.SECRET_REQUIRED });
      return;
    }

    const result = await generateJWT(header, payload, secret, algorithm);
    if (result.success) {
      setGeneratedToken(result.token);
      setCopied(false);
    } else {
      setJsonError(result.error);
    }
  }

  async function handleCopy() {
    const text = mode === Mode.PARSE ? token.trim() : generatedToken;
    if (!text) return;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyPart(part: 'header' | 'payload' | 'signature', value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedPart(part);
    window.setTimeout(() => setCopiedPart(null), 2000);
  }

  function handleSwitchMode(nextMode: Mode) {
    if (mode === nextMode) return;

    setToken('');
    setHeaderStr(DEFAULT_HEADER);
    setPayloadStr(createDefaultPayload());
    setParts({ header: '', payload: '', signature: '' });
    setSecret('');
    setAlgorithm(Algorithm.HS256);
    setGeneratedToken('');
    setIsValidFormat(false);
    setIsSignatureValid(null);
    setVerifyError(null);
    setJsonError(null);
    setCopied(false);
    setCopiedPart(null);
    setMode(nextMode);
  }

  const algorithmBar = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <span className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('tools.jwtParser.algorithm')}
      </span>
      <div className="flex items-center gap-4">
        {Object.values(Algorithm).map((alg) => (
          <label
            key={alg}
            className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
          >
            <input
              type="radio"
              name="jwt-algorithm"
              value={alg}
              checked={algorithm === alg}
              onChange={(event) =>
                setAlgorithm(event.target.value as Algorithm)
              }
              className="h-3.5 w-3.5 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-slate-400"
            />
            {AlgorithmLabels[alg]}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => handleSwitchMode(Mode.PARSE)}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              mode === Mode.PARSE
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {t('tools.jwtParser.parseMode')}
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode(Mode.GENERATE)}
            className={cn(
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              mode === Mode.GENERATE
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {t('tools.jwtParser.generateMode')}
          </button>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-emerald-600 sm:flex dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('common.clientSideExecution')}
        </span>
      </div>

      {mode === Mode.PARSE && (
        <>
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <span>{t('tools.jwtParser.tokenInput')}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {t('common.copySuccess')}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    {t('common.copy')}
                  </>
                )}
              </button>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={t('tools.jwtParser.tokenPlaceholder')}
                className="min-h-[88px] w-full resize-y bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
              />
            </div>
            {!isValidFormat && token && (
              <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/40">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  {t('tools.jwtParser.invalidTokenFormat')}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              <Split className="h-3.5 w-3.5 text-slate-400" />
              {t('tools.jwtParser.partsTitle')}
            </div>
            <div className="flex flex-col">
              {isValidFormat ? (
                (
                  [
                    { key: 'header', label: t('tools.jwtParser.headerPart'), value: parts.header },
                    { key: 'payload', label: t('tools.jwtParser.payloadPart'), value: parts.payload },
                    { key: 'signature', label: t('tools.jwtParser.signaturePart'), value: parts.signature },
                  ] as const
                ).map((part, index) => (
                  <div
                    key={part.key}
                    className={cn(
                      'flex flex-col gap-1.5 px-4 py-3',
                      index !== 0 && 'border-t border-slate-100 dark:border-slate-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {part.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPart(part.key, part.value)}
                        disabled={!part.value}
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:cursor-default dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        {copiedPart === part.key ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {t('common.copySuccess')}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            {t('common.copy')}
                          </>
                        )}
                      </button>
                    </div>
                    <p className="break-all font-mono text-xs text-slate-800 dark:text-slate-200">
                      {part.value}
                    </p>
                  </div>
                ))
              ) : (
                <p className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  {t('tools.jwtParser.partsEmpty')}
                </p>
              )}
            </div>
          </div>

          {isValidFormat && (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {t('tools.jwtParser.header')}
                  </div>
                  <div className="bg-slate-900 p-4 dark:bg-slate-950">
                    <pre className="overflow-auto font-mono text-xs text-emerald-400">
                      {headerStr}
                    </pre>
                  </div>
                </div>

                <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {t('tools.jwtParser.payload')}
                  </div>
                  <div className="bg-slate-900 p-4 dark:bg-slate-950">
                    <pre className="overflow-auto font-mono text-xs text-emerald-400">
                      {payloadStr}
                    </pre>
                  </div>
                </div>
              </div>
            </>
          )}

          {isValidFormat && (
            <>
              {algorithmBar}

              <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                  <span>{t('tools.jwtParser.secretKey')}</span>
                  <span
                    aria-hidden={isSignatureValid === null}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium transition-opacity',
                      isSignatureValid === null
                        ? 'border-transparent opacity-0'
                        : isSignatureValid
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-400',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isSignatureValid === null
                          ? 'bg-transparent'
                          : isSignatureValid
                            ? 'bg-emerald-500'
                            : 'bg-rose-500',
                      )}
                    />
                    {isSignatureValid === null
                      ? t('tools.jwtParser.signatureInvalid')
                      : isSignatureValid
                        ? t('tools.jwtParser.signatureValid')
                        : t('tools.jwtParser.signatureInvalid')}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <input
                    type="text"
                    value={secret}
                    onChange={(event) => setSecret(event.target.value)}
                    placeholder={t('tools.jwtParser.secretPlaceholder')}
                    className="w-full bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
                  />
                </div>
                {verifyError && (
                  <div className="flex items-start gap-2 border-t border-rose-200 bg-rose-50/60 px-4 py-2 dark:border-rose-900/60 dark:bg-rose-950/30">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      {t(
                        `tools.jwtParser.${verifyError.key}`,
                        verifyError.params,
                      )}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {mode === Mode.GENERATE && (
        <>
          {algorithmBar}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                {t('tools.jwtParser.headerJson')}
              </div>
              <div className="px-4 py-3">
                <textarea
                  value={headerStr}
                  onChange={(event) => setHeaderStr(event.target.value)}
                  className="min-h-[120px] w-full resize-y bg-transparent font-mono text-xs focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                {t('tools.jwtParser.payloadJson')}
              </div>
              <div className="px-4 py-3">
                <textarea
                  value={payloadStr}
                  onChange={(event) => setPayloadStr(event.target.value)}
                  className="min-h-[120px] w-full resize-y bg-transparent font-mono text-xs focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
              {t('tools.jwtParser.secretKey')}
            </div>
            <div className="flex items-center gap-2 px-4 py-3">
              <input
                type="text"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={t(
                  'tools.jwtParser.secretPlaceholderGenerate',
                )}
                className="flex-1 bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleGenerate}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('tools.jwtParser.generateButton')}
              </button>
            </div>
            {jsonError && (
              <div className="flex items-start gap-2 border-t border-rose-200 bg-rose-50/60 px-4 py-2 dark:border-rose-900/60 dark:bg-rose-950/30">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {t(`tools.jwtParser.${jsonError.key}`, jsonError.params)}
                </p>
              </div>
            )}
          </div>

          {generatedToken && (
            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
                <span>{t('tools.jwtParser.generatedToken')}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t('common.copySuccess')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                      {t('common.copy')}
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-900 p-4 dark:bg-slate-950">
                <p className="break-all font-mono text-xs leading-relaxed text-emerald-400">
                  {generatedToken}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default JWTParser;
