import {
  Barcode,
  Binary,
  Blend,
  Bot,
  Braces,
  Calculator,
  Clock,
  Code,
  Droplets,
  Eye,
  EyeOff,
  FileCode,
  FileText,
  Fingerprint,
  Flame,
  Gauge,
  Globe,
  HardDrive,
  Hash,
  Image,
  KeyRound,
  Layers,
  LayoutGrid,
  List,
  Map,
  MoonStar,
  Music,
  Palette,
  Pipette,
  QrCode,
  ShieldCheck,
  Shuffle,
  Sigma,
  Smartphone,
  Snowflake,
  Sparkles,
  Table2,
  Tags,
  Triangle,
  Type,
  type LucideProps,
} from 'lucide-react';

/**
 * 工具图标名称与对应图标的映射表
 */
const toolIconMap = {
  Braces,
  Image,
  FileText,
  Code,
  ShieldCheck,
  Palette,
  Clock,
  LayoutGrid,
  FileCode,
  Fingerprint,
  Flame,
  QrCode,
  Pipette,
  Blend,
  Gauge,
  Shuffle,
  MoonStar,
  Droplets,
  Layers,
  Tags,
  Eye,
  EyeOff,
  Bot,
  Map,
  List,
  Smartphone,
  Sparkles,
  Snowflake,
  Calculator,
  Type,
  Binary,
  Sigma,
  KeyRound,
  Music,
  Globe,
  Hash,
  Table2,
  HardDrive,
  Barcode,
  Triangle,
};

/**
 * 工具图标组件属性
 */
interface ToolIconProps extends LucideProps {
  /** 图标名称，对应工具元数据中的 iconName */
  name: string;
}

/**
 * 按名称渲染对应的 lucide 工具图标，未注册的名称回退为通用图标
 *
 * @param props - 组件属性
 * @param props.name - 图标名称
 * @returns 对应图标节点
 */
function ToolIcon({ name, ...rest }: ToolIconProps) {
  const Icon = toolIconMap[name as keyof typeof toolIconMap] ?? Braces;
  return <Icon {...rest} />;
}

export default ToolIcon;
