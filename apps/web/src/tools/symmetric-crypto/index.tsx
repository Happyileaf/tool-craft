'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  encrypt,
  decrypt,
  type AesOperationError,
} from './utils/aes';

const DEFAULT_KEY = 'your-secret-key';

/**
 * AES-GCM 对称加密工具，可以加密文本分享给他人，只有知道密钥才能解密。
 * 所有运算在浏览器本地完成，不泄露明文和密钥。
 *
 * @returns AES 加密/解密交互界面
 */
function SymmetricCrypto() {
  const { t } = useI18n();
  const [plaintext, setPlaintext] = useState(() =>
    t('tools.aes.defaultPlaintext'),
  );
  const [key, setKey] = useState(DEFAULT_KEY);
  const [encrypted, setEncrypted] = useState('');
  const [toDecrypt, setToDecrypt] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [error, setError] = useState<AesOperationError | null>(null);
  const [copied, setCopied] = useState(false);

  async function doEncrypt() {
    if (!plaintext || !key) {
      setEncrypted('');
      return;
    }
    const result = await encrypt(plaintext, key);
    if (result.success) {
      setEncrypted(result.encrypted);
      setError(null);
    } else {
      setEncrypted('');
      setError(result.error);
    }
  }

  async function doDecrypt() {
    if (!toDecrypt || !key) {
      setDecrypted('');
      return;
    }
    const result = await decrypt(toDecrypt, key);
    if (result.success) {
      setDecrypted(result.plaintext);
      setError(null);
    } else {
      setDecrypted('');
      setError(result.error);
    }
  }

  // Auto encrypt when plaintext or key changes
  if (plaintext && key) {
    doEncrypt();
  }

  async function handleCopy() {
    const textToCopy = encrypted;
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Encrypt section */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">
            {t('tools.aes.encryptTitle')}
          </h3>

          {/* Plaintext input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.aes.plaintextLabel')}
            </label>
            <textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder={t('tools.aes.plaintextPlaceholder')}
              className="min-h-[140px] rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Key input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.aes.secretKey')}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('tools.aes.keyPlaceholder')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('tools.aes.keyHint')}
            </p>
          </div>

          {/* Encrypted result */}
          {encrypted && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.aes.encryptedResult')}
                </label>
              </div>
              <div className="flex items-start gap-2">
                <pre className="overflow-auto break-all flex-1 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
                  {encrypted}
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

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {t(`tools.aes.${error.key}`)}
              </p>
            </div>
          )}
        </div>

        {/* Decrypt section */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">
            {t('tools.aes.decryptTitle')}
          </h3>

          {/* Ciphertext input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.aes.ciphertextLabel')}
            </label>
            <textarea
              value={toDecrypt}
              onChange={(e) => {
                setToDecrypt(e.target.value);
                setDecrypted('');
                setError(null);
              }}
              placeholder={t('tools.aes.ciphertextPlaceholder')}
              className="min-h-[140px] rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Key input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('tools.aes.secretKey')}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('tools.aes.keyPlaceholder')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Decrypt button */}
          <button
            type="button"
            onClick={doDecrypt}
            disabled={!toDecrypt || !key}
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {t('tools.aes.decryptButton')}
          </button>

          {/* Decrypted result */}
          {decrypted && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('tools.aes.decryptedResult')}
                </label>
              </div>
              <pre className="overflow-auto break-all rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
                {decrypted}
              </pre>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {t(`tools.aes.${error.key}`)}
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t('tools.aes.note')}
          </p>
        </div>
      )}
    </div>
  );
}

export default SymmetricCrypto;
