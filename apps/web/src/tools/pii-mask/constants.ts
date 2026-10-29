/**
 * PII 脱敏工具内常量
 */

/** 默认示例文本，覆盖各类可识别的敏感信息 */
export const DEFAULT_INPUT = `客户反馈记录：
联系人：张伟，邮箱 zhangwei@example.com，备用邮箱 zhang_wei@mail.example.org
手机号：13812345678
身份证号：11010119900307123X
银行卡号：6222021234567890123
服务器地址：192.168.1.100 与 2001:db8::1（参考 https://example.com/docs 不会被掩码）
鉴权信息：Authorization: Bearer abcdefghijklmnopqrs，api_key=sk-1234567890abcdef`;
