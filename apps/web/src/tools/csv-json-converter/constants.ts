export const DEFAULT_SAMPLE_CSV = `name,age,city,job
Alice,30,New York,Engineer
Bob,25,London,Designer
Charlie,35,Paris,Developer
Diana,28,Berlin,Manager`;

export const DEFAULT_SAMPLE_JSON = `[
  {
    "name": "Alice",
    "age": "30",
    "city": "New York",
    "job": "Engineer"
  },
  {
    "name": "Bob",
    "age": "25",
    "city": "London",
    "job": "Designer"
  }
]`;

export const DELIMITER_OPTIONS = [
  { label: '逗号 (,)', value: ',' },
  { label: '制表符 (\\t)', value: '\t' },
  { label: '分号 (;)', value: ';' },
  { label: '竖线 (|)', value: '|' },
];
