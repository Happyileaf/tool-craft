import { useState, useEffect } from 'react';
import { ToolComponentProps } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { parseJwt, splitJwt, verifySignature } from './utils/jwt';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { copyToClipboard } from '../../../lib/copy';

type Mode = 'parse' | 'generate';

export default function JwtParser({ defaultSampleInput }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('parse');
  const [token, setToken] = useState(defaultSampleInput || '');
  const [secret, setSecret] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [result, setResult] = useState<{
    header: any | null;
    payload: any | null;
    error: string | null;
    isValidSignature: boolean | null;
  }>({
    header: null,
    payload: null,
    error: null,
    isValidSignature: null,
  });

  useEffect(() => {
    if (mode === 'parse') {
      parseToken();
    }
  }, [token, mode]);

  const parseToken = () => {
    const parsed = parseJwt(token);
    setResult({ ...parsed, isValidSignature: null });
    if (parsed.header) {
      setHeaderText(JSON.stringify(parsed.header, null, 2));
    }
    if (parsed.payload) {
      setPayloadText(JSON.stringify(parsed.payload, null, 2));
    }
  };

  const doVerify = async () => {
    if (!token) return;
    const parts = splitJwt(token);
    if (parts.length !== 3) return;
    const [headerB64, payloadB64, signature] = parts;
    const isValid = await verifySignature(headerB64, payloadB64, signature, secret);
    setResult((prev) => ({ ...prev, isValidSignature: isValid }));
  };

  const handleCopyJson = (text: string) => {
    copyToClipboard(text);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      <Tabs
        defaultValue="parse"
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parse">解析</TabsTrigger>
          <TabsTrigger value="generate">生成</TabsTrigger>
        </TabsList>
        <TabsContent value="parse" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="token" className="text-sm font-medium">JWT Token</label>
            <Textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="粘贴你的 JWT token 到这里..."
              className="min-h-[100px]"
            />
          </div>

          {result.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">{result.error}</span>
            </div>
          )}

          {result.header && result.payload && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Header</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyJson(headerText)}
                  >
                    <Copy size={14} className="mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={headerText}
                  readOnly
                  className="font-mono text-sm min-h-[120px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Payload</label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyJson(payloadText)}
                  >
                    <Copy size={14} className="mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={payloadText}
                  readOnly
                  className="font-mono text-sm min-h-[180px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="secret" className="text-sm font-medium">
                  签名密钥 (验证签名用，可选)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="输入密钥验证签名"
                  />
                  <Button onClick={doVerify} disabled={!token || !secret}>
                    验证签名
                  </Button>
                </div>
                {result.isValidSignature !== null && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      result.isValidSignature
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {result.isValidSignature ? (
                      <>
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">签名验证通过</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={18} />
                        <span className="text-sm font-medium">签名验证失败</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {result.header && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">算法: {result.header.alg || '?'}</Badge>
                  <Badge variant="secondary">类型: {result.header.typ || '?'}</Badge>
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="generate" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="header-gen" className="text-sm font-medium">
              Header (JSON 格式)
            </label>
            <Textarea
              id="header-gen"
              value={headerText || '{\n  "alg": "HS256",\n  "typ": "JWT"\n}'}
              onChange={(e) => setHeaderText(e.target.value)}
              className="font-mono text-sm min-h-[120px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="payload-gen" className="text-sm font-medium">
              Payload (JSON 格式)
            </label>
            <Textarea
              id="payload-gen"
              value={payloadText || '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'}
              onChange={(e) => setPayloadText(e.target.value)}
              className="font-mono text-sm min-h-[180px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="secret-gen" className="text-sm font-medium">
              签名密钥
            </label>
            <Input
              id="secret-gen"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="输入用于签名的密钥"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                try {
                  const header = JSON.parse(headerText);
                  const payload = JSON.parse(payloadText);
                  // Note: 签名需要密钥，我们只输出前面两部分在这里
                  const generated = `${btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.[your signature here]`;
                  setToken(generated);
                  setResult({
                    header,
                    payload,
                    error: null,
                    isValidSignature: null,
                  });
                  setMode('parse');
                } catch (e) {
                  setResult({
                    header: null,
                    payload: null,
                    error: `生成失败: ${e instanceof Error ? e.message : String(e)}`,
                    isValidSignature: null,
                  });
                }
              }}
              disabled={!headerText || !payloadText}
            >
              生成 Token
            </Button>
            {token && mode === 'parse' && (
              <Button variant="secondary" onClick={() => copyToClipboard(token)}>
                <Copy size={14} className="mr-1" />
                复制 Token
              </Button>
            )}
          </div>
          {result.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">{result.error}</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
