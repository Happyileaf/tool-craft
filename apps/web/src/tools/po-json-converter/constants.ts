export type ConvertDirection = "po2json" | "json2po";

export interface DirectionOption {
  value: ConvertDirection;
  label: string;
}

export const DIRECTION_OPTIONS: DirectionOption[] = [
  { value: "po2json", label: "PO / POT → JSON" },
  { value: "json2po", label: "JSON → PO" },
];

export const SAMPLE_PO = `#: src/app.ts:12
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\\n"

#. Greeting
msgid "Hello"
msgstr "你好"

msgid "One item"
msgid_plural "{count} items"
msgstr[0] "一个条目"
msgstr[1] "{count} 个条目"
`;

export const SAMPLE_JSON = `{
  "Hello": "你好",
  "One item": ["一个条目", "{count} 个条目"]
}`;
