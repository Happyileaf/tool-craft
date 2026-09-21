/**
 * JSON 输入区组件属性
 */
interface JsonInputProps {
  /** 文本框当前内容，由父组件持有，格式化失败时也不会被清空 */
  value: string;
  /** 内容变化回调，参数为文本框最新内容 */
  onChange: (value: string) => void;
}

/**
 * JSON 输入区，受控多行文本框，等宽字体便于核对括号与引号
 *
 * @param props - 组件属性
 * @param props.value - 文本框当前内容
 * @param props.onChange - 内容变化回调
 * @returns 带标题与中文占位提示的输入文本框
 */
function JsonInput({ value, onChange }: JsonInputProps) {
  return (
    <div className="flex h-full flex-col gap-2">
      <label
        htmlFor="json-input"
        className="text-sm font-medium text-slate-700"
      >
        输入 JSON
      </label>
      <textarea
        id="json-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'在此粘贴 JSON 内容，例如：\n{"name":"tool-craft","tags":["json"]}'}
        spellCheck={false}
        className="min-h-96 flex-1 resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm leading-6 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      />
    </div>
  );
}

export default JsonInput;
