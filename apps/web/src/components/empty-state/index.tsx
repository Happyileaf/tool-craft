/**
 * 空状态提示组件属性
 */
interface EmptyStateProps {
  /** 展示给用户的中文空状态文案 */
  message: string;
}

/**
 * 空状态提示，在列表无数据时给出居中的中文说明
 *
 * @param props - 组件属性
 * @param props.message - 空状态文案
 * @returns 空状态提示节点
 */
function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed py-12 text-sm text-slate-500">
      {message}
    </div>
  );
}

export default EmptyState;
