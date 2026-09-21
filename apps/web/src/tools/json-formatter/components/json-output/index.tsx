/**
 * JSON 结果区组件属性
 */
interface JsonOutputProps {
  /** 是否已执行过格式化，用于区分初始引导态与错误态 */
  hasFormatted: boolean;
  /** 格式化成功后的 JSON 文本，未成功时为 null */
  output: string | null;
  /** 格式化失败的中文错误信息，无错误时为 null */
  errorMessage: string | null;
}

/**
 * JSON 结果区，按未操作、成功、失败三种状态分别展示引导、等宽结果与红色错误
 *
 * @param props - 组件属性
 * @param props.hasFormatted - 是否已执行过格式化
 * @param props.output - 格式化成功后的 JSON 文本
 * @param props.errorMessage - 格式化失败的中文错误信息
 * @returns 引导提示、预格式化结果或错误提示节点
 */
function JsonOutput({ hasFormatted, output, errorMessage }: JsonOutputProps) {
  /**
   * 依据当前状态推导结果区应展示的内容
   *
   * @returns 与三态对应的结果区节点
   */
  function renderBody() {
    if (errorMessage) {
      return (
        <div className="min-h-96 flex-1 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-600">
          {errorMessage}
        </div>
      );
    }

    if (output !== null) {
      return (
        <pre className="min-h-96 flex-1 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm leading-6 text-slate-800">
          {output}
        </pre>
      );
    }

    return (
      <div className="flex min-h-96 flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">
        {hasFormatted
          ? '格式化未成功，请根据错误提示修改左侧内容后重试'
          : '在左侧输入 JSON，点击「格式化」后在此查看缩进结果'}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">格式化结果</span>
      {renderBody()}
    </div>
  );
}

export default JsonOutput;
