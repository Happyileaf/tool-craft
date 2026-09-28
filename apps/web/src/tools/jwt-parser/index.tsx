'use client';

import { useState, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Mode, Algorithm, AlgorithmLabels } from './constants';
import {
  parseJWT,
  generateJWT,
  verifySignature,
  tryParseJSON,
  JwtErrorKey,
  type JwtOperationError,
} from './utils/jwt';

const DEFAULT_PARSE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const DEFAULT_HEADER = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);
const DEFAULT_PAYLOAD = JSON.stringify({
  sub: '1234567890',
  name: 'John Doe',
  iat: Math.floor(Date.now() / 1000),
}, null, 2);

/**
 * JWT 生成器/解析器，支持解析已有的 JWT，查看 Header 和 Payload，验证签名，也可以生成新的 JWT。
 * 所有运算在浏览器本地完成，不泄露密钥。
 *
 * @returns JWT 生成器/解析器交互界面
 */
function JWTParser() {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(Mode.PARSE);
  const [token, setToken] = useState(DEFAULT_PARSE_TOKEN);
  const [headerStr, setHeaderStr] = useState(DEFAULT_HEADER);
  const [payloadStr, setPayloadStr] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.HS256);
  const [parsed, setParsed] = useState<ReturnType<typeof parseJWT> | null>(null);
  const [generatedToken, setGeneratedToken] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean | null>(null);
  const [verifyError, setVerifyError] = useState<JwtOperationError | null>(null);
  const [jsonError, setJsonError] = useState<JwtOperationError | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse mode: parse token when token changes
  useEffect(() => {
    if (mode !== Mode.PARSE) return;

    const result = parseJWT(token.trim());
    setParsed(result);
    setIsValidFormat(result.isValidFormat);
    if (result.isValidFormat) {
      setHeaderStr(JSON.stringify(result.header, null, 2));
      setPayloadStr(JSON.stringify(result.payload, null, 2));
    }
    setIsSignatureValid(null);
    setVerifyError(null);
  }, [token, mode]);

  // Verify signature when token or secret changes
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
        algorithm
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
    const textToCopy = mode === Mode.PARSE ? token : generatedToken;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode selector */}
      <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode(Mode.PARSE)}
            className={
              mode === Mode.PARSE
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.jwtParser.parseMode')}
          </button>
          <button
            type="button"
            onClick={() => setMode(Mode.GENERATE)}
            className={
              mode === Mode.GENERATE
                ? 'rounded bg-slate-900 px-3 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                : 'rounded px-3 py-1 font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {t('tools.jwtParser.generateMode')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        {mode === Mode.PARSE && (
          /* Parse mode input */
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.jwtParser.tokenInput')}
            </label>
            <div className="flex items-start gap-2">
              <textarea
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('tools.jwtParser.tokenPlaceholder')}
                className="min-h-[80px] flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                title={t('common.copyResult')}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            {!isValidFormat && token && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t('tools.jwtParser.invalidTokenFormat')}
                </p>
              </div>
            )}
          </div>
        )}

        {mode === Mode.PARSE && isValidFormat && (
          <>
            {/* Header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.jwtParser.header')}
                </label>
              </div>
              <pre className="overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                {headerStr}
              </pre>
            </div>

            {/* Payload */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.jwtParser.payload')}
                </label>
              </div>
              <pre className="overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                {payloadStr}
              </pre>
            </div>

            {/* Signature verification */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.jwtParser.secretKey')}
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={t('tools.jwtParser.secretPlaceholder')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
              />

              {isSignatureValid !== null && (
                <div
                  className={`mt-2 rounded-lg border p-3 ${
                    isSignatureValid
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      isSignatureValid
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {isSignatureValid
                      ? t('tools.jwtParser.signatureValid')
                      : t('tools.jwtParser.signatureInvalid')}
                  </p>
                  {verifyError && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {t(`tools.jwtParser.${verifyError.key}`, verifyError.params)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {mode === Mode.GENERATE && (
          <>
            {/* Algorithm selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.jwtParser.algorithm')}
              </label>
              <div className="flex items-center gap-2">
                {Object.values(Algorithm).map((alg) => (
                  <label
                    key={alg}
                    className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value={alg}
                      checked={algorithm === alg}
                      onChange={(e) =>
                        setAlgorithm(e.target.value as Algorithm)
                      }
                      className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800"
                    />
                    {AlgorithmLabels[alg]}
                  </label>
                ))}
              </div>
            </div>

            {/* Header editor */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.jwtParser.headerJson')}
              </label>
              <textarea
                value={headerStr}
                onChange={(e) => setHeaderStr(e.target.value)}
                className="min-h-[100px] flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Payload editor */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.jwtParser.payloadJson')}
              </label>
              <textarea
                value={payloadStr}
                onChange={(e) => setPayloadStr(e.target.value)}
                className="min-h-[150px] flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Secret */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('tools.jwtParser.secretKey')}
              </label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={t('tools.jwtParser.secretPlaceholderGenerate')}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {jsonError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {t(`tools.jwtParser.${jsonError.key}`, jsonError.params)}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {t('tools.jwtParser.generateButton')}
            </button>

            {generatedToken && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('tools.jwtParser.generatedToken')}
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <pre className="overflow-auto flex-1 break-all rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                    {generatedToken}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                    title={t('common.copyResult')}
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default JWTParser;
