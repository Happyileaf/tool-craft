/** LDAP 过滤器工具的常量与示例 */

export const DEFAULT_FILTER = '(&(ou=Sales)(|(title=Manager)(!(status=Archived)))(mail=*@example.com))';

export const FILTER_PLACEHOLDER = '例如：(&(cn=John)(objectClass=person))';

export const FILTER_PRESETS: Array<{ label: string; filter: string }> = [
  { label: '人员查询', filter: '(&(objectClass=person)(sn=Smith)(givenName=John))' },
  { label: '组内成员', filter: '(&(objectClass=groupOfNames)(member=cn=admin,dc=example,dc=com))' },
  { label: '子串匹配', filter: '(cn=*admin*user*)' },
  { label: '取反组合', filter: '(!(userAccountControl=514))' },
  { label: '带转义值', filter: '(cn=Jo\\28hn\\29)' },
];
