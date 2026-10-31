export const DEFAULT_JSON = `{
  "name": "张三",
  "role": "admin",
  "tags": ["dev", "ops"],
  "active": true,
  "page": 2,
  "remark": "hello world"
}`;

export const DEFAULT_FORM =
  'name=%E5%BC%A0%E4%B8%89&role=admin&tags%5B0%5D=dev&tags%5B1%5D=ops&active=true&page=2&remark=hello+world';

export const HINT =
  'JSON 对象与 application/x-www-form-urlencoded 请求体双向转换：RFC 3986 百分号编码，空格 + / %20 可切换，数组与嵌套对象支持括号 / PHP / 点路径风格。全部在浏览器本地完成。';
