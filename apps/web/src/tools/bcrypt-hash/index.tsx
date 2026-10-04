import { useState } from 'react';
import { ToolComponentProps } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Label } from '../../../components/ui/label';
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { copyToClipboard } from '../../../lib/copy';
import { hashPassword, verifyPassword } from './utils/bcrypt';

type Mode = 'generate' | 'verify';

export default function BcryptHash({ defaultSampleInput }: ToolComponentProps) {
  const [mode, setMode] = useState<Mode>('generate');
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [cost, setCost] = useState(10);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const doHash = async () => {
    if (!password) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const newHash = await hashPassword(password, cost);
      setHash(newHash);
      setResult({
        success: true,
        message: '哈希生成成功',
      });
    } catch (e) {
      setResult({
        success: false,
        message: `生成失败: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const doVerify = async () => {
    if (!password || !hash) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const isValid = await verifyPassword(password, hash);
      if (isValid) {
        setResult({
          success: true,
          message: '密码匹配哈希',
        });
      } else {
        setResult({
          success: false,
          message: '密码不匹配哈希',
        });
      }
    } catch (e) {
      setResult({
        success: false,
        message: `验证失败: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <Tabs
        defaultValue="generate"
        value={mode}
        onValueChange={(v) => setMode(v as Mode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">生成哈希</TabsTrigger>
          <TabsTrigger value="verify">验证密码</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password-generate">密码</Label>
            <Input
              id="password-generate"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入要加密的密码"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Cost (Rounds): {cost}</Label>
            </div>
            <Slider
              defaultValue={[cost]}
              min={4}
              max={16}
              step={1}
              onValueChange={(value) => setCost(value[0])}
            />
            <p className="text-sm text-muted-foreground">
              数值越大越安全，但计算越慢。推荐值：10-12。
            </p>
          </div>

          <Button onClick={doHash} disabled={!password || isProcessing}>
            {isProcessing ? '计算中...' : '生成 BCrypt 哈希'}
          </Button>

          {hash && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="hash-result">生成的哈希</Label>
              <div className="flex gap-2">
                <Input
                  id="hash-result"
                  type="text"
                  value={hash}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(hash)} className="shrink-0">
                  <Copy size={18} className="mr-2" />
                  复制
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="verify" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password-verify">密码</Label>
            <Input
              id="password-verify"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入要验证的密码"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="hash-input">BCrypt 哈希</Label>
            <Input
              id="hash-input"
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="输入 BCrypt 哈希"
            />
          </div>

          <Button onClick={doVerify} disabled={!password || !hash || isProcessing}>
            {isProcessing ? '验证中...' : '验证密码'}
          </Button>
        </TabsContent>
      </Tabs>

      {result && (
        <div
          className={`flex items-center gap-2 p-3 rounded-md ${
            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.success ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          <span className="text-sm font-medium">{result.message}</span>
        </div>
      )}
    </div>
  );
}
