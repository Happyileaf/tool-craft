'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  Lock,
  LockOpen,
  ShieldCheck,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
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
  const [plaintext, setPlaintext] = useState('');
  const [key, setKey] = useState(DEFAULT_KEY);
  const [encrypted, setEncrypted] = useState('');
  const [toDecrypt, setToDecrypt] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [encryptError, setEncryptError] = useState<AesOperationError | null>(
    null,
  );
  const [decryptError, setDecryptError] = useState<AesOperationError | null>(
    null,
  );
  const [copiedPlaintext, setCopiedPlaintext] = useState(false);
  const [copiedCiphertext, setCopiedCiphertext] = useState(false);
  const [copiedEncrypted, setCopiedEncrypted] = useState(false);
  const [copiedDecrypted, setCopiedDecrypted] = useState(false);

  useEffect(() => {
    setPlaintext(t('tools.aes.defaultPlaintext'));
  }, []);

  async function doEncrypt() {
    if (!plaintext || !key) {
      setEncrypted('');
      setEncryptError(null);
      return;
    }
    const result = await encrypt(plaintext, key);
    setCopiedEncrypted(false);
    if (result.success) {
      setEncrypted(result.encrypted);
      setEncryptError(null);
    } else {
      setEncrypted('');
      setEncryptError(result.error);
    }
  }

  async function doDecrypt() {
    if (!toDecrypt || !key) {
      setDecrypted('');
      setDecryptError(null);
      return;
    }
    const result = await decrypt(toDecrypt, key);
    setCopiedDecrypted(false);
    if (result.success) {
      setDecrypted(result.plaintext);
      setDecryptError(null);
    } else {
      setDecrypted('');
      setDecryptError(result.error);
    }
  }

  async function handleCopyPlaintext() {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopiedPlaintext(true);
    window.setTimeout(() => setCopiedPlaintext(false), 2000);
  }

  async function handleCopyCiphertext() {
    if (!toDecrypt) return;
    await navigator.clipboard.writeText(toDecrypt);
    setCopiedCiphertext(true);
    window.setTimeout(() => setCopiedCiphertext(false), 2000);
  }

  async function handleCopyEncrypted() {
    if (!encrypted) return;
    await navigator.clipboard.writeText(encrypted);
    setCopiedEncrypted(true);
    window.setTimeout(() => setCopiedEncrypted(false), 2000);
  }

  async function handleCopyDecrypted() {
    if (!decrypted) return;
    await navigator.clipboard.writeText(decrypted);
    setCopiedDecrypted(true);
    window.setTimeout(() => setCopiedDecrypted(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            type="text"
            value={key}
            onChange={(event) => {
              setKey(event.target.value);
              setEncrypted('');
              setEncryptError(null);
            }}
            placeholder={t('tools.aes.keyPlaceholder')}
            className="min-w-0 flex-1 bg-transparent font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
          />
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-emerald-600 sm:flex dark:text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('common.clientSideExecution')}
        </span>
      </div>

      <p className="-mt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
        {t('tools.aes.keyHint')}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              {t('tools.aes.encryptTitle')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={doEncrypt}
                disabled={!plaintext || !key}
                className={cn(
                  'flex items-center gap-1 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                  'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
                )}
              >
                {t('tools.aes.encryptButton')}
              </button>
              <button
                type="button"
                onClick={handleCopyPlaintext}
                disabled={!plaintext}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copiedPlaintext ? (
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
          </div>
          <textarea
            value={plaintext}
            onChange={(event) => {
              setPlaintext(event.target.value);
              setEncrypted('');
              setEncryptError(null);
            }}
            placeholder={t('tools.aes.plaintextPlaceholder')}
            className="min-h-[320px] w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <LockOpen className="h-3.5 w-3.5" />
              {t('tools.aes.decryptTitle')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={doDecrypt}
                disabled={!toDecrypt || !key}
                className={cn(
                  'flex items-center gap-1 rounded-md border border-transparent px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                  'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
                )}
              >
                {t('tools.aes.decryptButton')}
              </button>
              <button
                type="button"
                onClick={handleCopyCiphertext}
                disabled={!toDecrypt}
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {copiedCiphertext ? (
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
          </div>
          <textarea
            value={toDecrypt}
            onChange={(event) => {
              setToDecrypt(event.target.value);
              setDecrypted('');
              setDecryptError(null);
            }}
            placeholder={t('tools.aes.ciphertextPlaceholder')}
            className="min-h-[320px] w-full flex-1 resize-none bg-transparent px-4 py-3 font-mono text-xs focus:outline-none focus:ring-0 placeholder:text-slate-400 sm:text-sm dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              {t('tools.aes.encryptedResult')}
            </span>
            <button
              type="button"
              onClick={handleCopyEncrypted}
              disabled={!encrypted}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {copiedEncrypted ? (
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
          <div className="max-h-72 flex-1 overflow-y-auto bg-slate-900 p-4 dark:bg-slate-950">
            {encryptError ? (
              <p className="flex items-start gap-1.5 font-mono text-xs text-rose-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t(`tools.aes.${encryptError.key}`)}
              </p>
            ) : encrypted ? (
              <p className="break-all font-mono text-xs leading-relaxed text-emerald-400">
                {encrypted}
              </p>
            ) : (
              <p className="font-mono text-xs text-slate-500">
                {t('tools.aes.encryptedEmpty')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <LockOpen className="h-3.5 w-3.5" />
              {t('tools.aes.decryptedResult')}
            </span>
            <button
              type="button"
              onClick={handleCopyDecrypted}
              disabled={!decrypted}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {copiedDecrypted ? (
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
          <div className="max-h-72 flex-1 overflow-y-auto bg-slate-900 p-4 dark:bg-slate-950">
            {decryptError ? (
              <p className="flex items-start gap-1.5 font-mono text-xs text-rose-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t(`tools.aes.${decryptError.key}`)}
              </p>
            ) : decrypted ? (
              <p className="break-all font-mono text-xs leading-relaxed text-emerald-400">
                {decrypted}
              </p>
            ) : (
              <p className="font-mono text-xs text-slate-500">
                {t('tools.aes.decryptedEmpty')}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default SymmetricCrypto;
