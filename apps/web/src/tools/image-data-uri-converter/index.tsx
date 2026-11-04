"use client";

import React from "react";
import type { ToolComponentProps } from "../loaders";
import {
  Alert,
  Button,
  Card,
  Input,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CopyOutlined,
  DownloadOutlined,
  FileImageOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import {
  MAX_DATA_URI_LENGTH,
  MAX_FILE_BYTES,
  SUPPORTED_IMAGE_TYPES,
} from "./constants";
import {
  base64ToBytes,
  buildDataUri,
  formatBytes,
  getExtensionFromMime,
  parseDataUri,
  sniffImageMime,
} from "./utils/data-uri";

const { TextArea } = Input;
const { Text } = Typography;

type Direction = "encode" | "decode";

/**
 * 编码方向的图片产物
 */
interface EncodedImage {
  /** 原始文件名 */
  fileName: string;
  /** 实际 MIME 类型 */
  mimeType: string;
  /** 文件字节数 */
  size: number;
  /** 完整 Data URI */
  dataUri: string;
  /** 预览 URL（blob URL） */
  previewUrl: string;
}

/**
 * 解码方向的图片产物
 */
interface DecodedImage {
  /** 声明的 MIME 类型 */
  mimeType: string;
  /** 魔数探测到的实际类型 */
  sniffedType: string | null;
  /** 声明类型与实际类型是否一致 */
  typeMismatch: boolean;
  /** 解码字节数 */
  size: number;
  /** 预览 URL（blob URL） */
  previewUrl: string;
  /** 解码后的字节 */
  bytes: Uint8Array;
}

/**
 * 图片与 Base64 Data URI 互转工具：
 * 编码方向把本地图片文件读为 Data URI 并支持预览/复制；
 * 解码方向把 Data URI 还原为图片，做 MIME 白名单与魔数交叉校验后预览/下载。
 * 全部基于浏览器 File/Blob API 在本地处理，不上传任何数据。
 *
 * @param _props - 工具组件属性（本工具无默认样例输入）
 * @returns 双向转换交互界面
 */
const ImageDataUriConverter: React.FC<ToolComponentProps> = () => {
  const [direction, setDirection] = React.useState<Direction>("encode");
  const [encoded, setEncoded] = React.useState<EncodedImage | null>(null);
  const [decodeInput, setDecodeInput] = React.useState<string>("");
  const [decoded, setDecoded] = React.useState<DecodedImage | null>(null);
  const [decodeError, setDecodeError] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  /**
   * 释放旧的 blob URL，避免内存泄漏
   */
  const revokePreview = React.useCallback((url: string | null | undefined) => {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (encoded) {
        revokePreview(encoded.previewUrl);
      }
      if (decoded) {
        revokePreview(decoded.previewUrl);
      }
    };
  }, [encoded, decoded, revokePreview]);

  /**
   * 编码：读取本地图片文件并转换为 Data URI
   */
  const handleFile = React.useCallback(
    (file: File) => {
      if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        message.error(`不支持的图片类型：${file.type || "未知"}`);
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        message.error(`图片不能超过 ${formatBytes(MAX_FILE_BYTES)}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? "");
        const commaIndex = result.indexOf(",");
        const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : "";
        if (!base64) {
          message.error("文件读取结果为空");
          return;
        }
        setEncoded((previous) => {
          revokePreview(previous?.previewUrl);
          return {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            dataUri: buildDataUri(file.type, base64),
            previewUrl: URL.createObjectURL(file),
          };
        });
        message.success("图片已转换为 Data URI");
      };
      reader.onerror = () => message.error("文件读取失败，请重试");
      reader.readAsDataURL(file);
    },
    [revokePreview],
  );

  /**
   * 处理文件选择框变更
   */
  const onFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // 允许重复选择同一文件
      event.target.value = "";
    },
    [handleFile],
  );

  /**
   * 处理拖拽放置
   */
  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  /**
   * 解码：解析 Data URI 并还原为图片
   */
  const handleDecode = React.useCallback(() => {
    setDecodeError("");
    if (decodeInput.trim().length === 0) {
      setDecodeError("请先粘贴 Data URI 内容");
      return;
    }
    if (decodeInput.length > MAX_DATA_URI_LENGTH) {
      setDecodeError("输入内容过大，请控制在 20 MB 以内");
      return;
    }
    const parsed = parseDataUri(decodeInput);
    if (!parsed) {
      setDecodeError(
        "无法解析：请确认是 data:image/<类型>;base64,... 形式的合法图片 Data URI",
      );
      setDecoded((previous) => {
        revokePreview(previous?.previewUrl);
        return null;
      });
      return;
    }

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(parsed.data);
    } catch {
      setDecodeError("base64 解码失败，载荷可能已损坏");
      return;
    }

    const sniffedType = sniffImageMime(bytes);
    const typeMismatch =
      sniffedType !== null && sniffedType !== parsed.mimeType;
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: parsed.mimeType,
    });

    setDecoded((previous) => {
      revokePreview(previous?.previewUrl);
      return {
        mimeType: parsed.mimeType,
        sniffedType,
        typeMismatch,
        size: bytes.length,
        previewUrl: URL.createObjectURL(blob),
        bytes,
      };
    });
    message.success("Data URI 已还原为图片");
  }, [decodeInput, revokePreview]);

  /**
   * 复制文本到剪贴板
   */
  const copyText = React.useCallback((text: string, hint: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success(hint))
      .catch(() => message.error("复制失败，请手动选择复制"));
  }, []);

  /**
   * 下载解码后的图片
   */
  const downloadDecoded = React.useCallback(() => {
    if (!decoded) {
      return;
    }
    const extension = getExtensionFromMime(decoded.mimeType);
    const blob = new Blob([decoded.bytes.buffer as ArrayBuffer], {
      type: decoded.mimeType,
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `decoded-image.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [decoded]);

  return (
    <div className="space-y-4">
      <Card title="图片与 Base64 Data URI 互转">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="所有图片均在浏览器本地通过 FileReader / Blob 处理，不会上传到任何服务器；支持 PNG、JPEG、GIF、WebP、SVG、BMP、ICO、AVIF。"
        />
        <Segmented
          value={direction}
          onChange={(value) => setDirection(value as Direction)}
          options={[
            { label: "图片 → Data URI", value: "encode" },
            { label: "Data URI → 图片", value: "decode" },
          ]}
        />
      </Card>

      {direction === "encode" && (
        <Card title="编码：图片转 Data URI">
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            style={{
              border: "2px dashed rgb(209 213 219)",
              borderRadius: 8,
              padding: "40px 16px",
              textAlign: "center",
              cursor: "pointer",
              background: "rgb(249 250 251)",
            }}
          >
            <InboxOutlined style={{ fontSize: 40, color: "rgb(107 114 128)" }} />
            <p style={{ marginTop: 12, marginBottom: 4 }}>
              点击选择或拖拽图片到此处
            </p>
            <Text type="secondary" style={{ fontSize: 12 }}>
              单张图片不超过 {formatBytes(MAX_FILE_BYTES)}
            </Text>
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_IMAGE_TYPES.join(",")}
              style={{ display: "none" }}
              onChange={onFileChange}
            />
          </div>

          {encoded && (
            <div style={{ marginTop: 16 }} className="space-y-3">
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <img
                  src={encoded.previewUrl}
                  alt={encoded.fileName}
                  style={{
                    maxWidth: 220,
                    maxHeight: 220,
                    border: "1px solid rgb(229 231 235)",
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                />
                <Space direction="vertical" size={6}>
                  <Space wrap>
                    <Tag icon={<FileImageOutlined />} color="blue">
                      {encoded.mimeType}
                    </Tag>
                    <Tag>{formatBytes(encoded.size)}</Tag>
                    <Tag>{encoded.fileName}</Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Data URI 长度：{encoded.dataUri.length} 字符
                  </Text>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() =>
                      copyText(encoded.dataUri, "已复制完整 Data URI")
                    }
                  >
                    复制 Data URI
                  </Button>
                </Space>
              </div>
              <TextArea
                readOnly
                value={encoded.dataUri}
                autoSize={{ minRows: 4, maxRows: 10 }}
                style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              />
            </div>
          )}
        </Card>
      )}

      {direction === "decode" && (
        <Card title="解码：Data URI 转图片">
          <TextArea
            value={decodeInput}
            onChange={(event) => setDecodeInput(event.target.value)}
            placeholder="粘贴 data:image/png;base64,... 形式的 Data URI"
            autoSize={{ minRows: 6, maxRows: 14 }}
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          />
          <div style={{ marginTop: 12 }}>
            <Button type="primary" onClick={handleDecode}>
              还原为图片
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => {
                setDecodeInput("");
                setDecodeError("");
                setDecoded((previous) => {
                  revokePreview(previous?.previewUrl);
                  return null;
                });
              }}
            >
              清空
            </Button>
          </div>

          {decodeError && (
            <Alert
              style={{ marginTop: 12 }}
              type="error"
              showIcon
              message={decodeError}
            />
          )}

          {decoded && (
            <div style={{ marginTop: 16 }} className="space-y-3">
              {decoded.typeMismatch && (
                <Alert
                  type="warning"
                  showIcon
                  message={`类型不一致：Data URI 声明为 ${decoded.mimeType}，但文件头魔数探测为 ${decoded.sniffedType}`}
                />
              )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <img
                  src={decoded.previewUrl}
                  alt="解码预览"
                  style={{
                    maxWidth: 280,
                    maxHeight: 280,
                    border: "1px solid rgb(229 231 235)",
                    borderRadius: 8,
                    objectFit: "contain",
                  }}
                />
                <Space direction="vertical" size={6}>
                  <Space wrap>
                    <Tag color="blue">{decoded.mimeType}</Tag>
                    <Tag>{formatBytes(decoded.size)}</Tag>
                    {decoded.sniffedType && (
                      <Tag color={decoded.typeMismatch ? "orange" : "green"}>
                        魔数探测：{decoded.sniffedType}
                      </Tag>
                    )}
                  </Space>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={downloadDecoded}
                  >
                    下载图片（.{getExtensionFromMime(decoded.mimeType)}）
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ImageDataUriConverter;
