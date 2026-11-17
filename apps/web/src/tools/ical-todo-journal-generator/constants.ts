import type { RRuleSpec, TodoStatus, VTodoData, VJournalData, JournalStatus } from './utils/ical-todo-journal';

export const TODO_STATUS_OPTIONS: Array<{ label: string; value: TodoStatus }> = [
  { label: 'NEEDS-ACTION（待处理）', value: 'NEEDS-ACTION' },
  { label: 'IN-PROCESS（进行中）', value: 'IN-PROCESS' },
  { label: 'COMPLETED（已完成）', value: 'COMPLETED' },
  { label: 'CANCELLED（已取消）', value: 'CANCELLED' },
];

export const JOURNAL_STATUS_OPTIONS: Array<{ label: string; value: JournalStatus }> = [
  { label: 'DRAFT（草稿）', value: 'DRAFT' },
  { label: 'FINAL（定稿）', value: 'FINAL' },
  { label: 'CANCELLED（已取消）', value: 'CANCELLED' },
];

export const RRULE_FREQ_OPTIONS: Array<{ label: string; value: RRuleSpec['freq'] }> = [
  { label: 'HOURLY（每小时）', value: 'HOURLY' },
  { label: 'DAILY（每天）', value: 'DAILY' },
  { label: 'WEEKLY（每周）', value: 'WEEKLY' },
  { label: 'MONTHLY（每月）', value: 'MONTHLY' },
  { label: 'YEARLY（每年）', value: 'YEARLY' },
];

export const createEmptyTodo = (): VTodoData => ({
  title: '',
  dtstart: '',
  due: '',
  status: 'NEEDS-ACTION',
  priority: null,
  percentComplete: null,
  completedAt: '',
  rrule: null,
  relatedTo: '',
  categories: [],
  description: '',
});

export const createEmptyJournal = (): VJournalData => ({
  title: '',
  dtstart: '',
  status: 'DRAFT',
  categories: [],
  description: '',
  relatedTo: '',
});

export const SAMPLE_TODO: VTodoData = {
  title: '提交季度合规报告',
  dtstart: '2026-11-20T09:00',
  due: '2026-11-25T18:00',
  status: 'IN-PROCESS',
  priority: 1,
  percentComplete: 40,
  completedAt: '',
  rrule: { freq: 'WEEKLY', interval: 2, count: 4 },
  relatedTo: '',
  categories: ['合规', '季度任务'],
  description: '汇总 Q3 审计发现，附整改证据；注意逗号,分号;反斜杠\\会自动转义',
};

export const SAMPLE_JOURNAL: VJournalData = {
  title: '项目复盘日记',
  dtstart: '2026-11-18T20:00',
  status: 'FINAL',
  categories: ['复盘'],
  description: '今日完成 DICOM 工具联调，遗留 PACS 压测待跟进',
  relatedTo: '',
};
