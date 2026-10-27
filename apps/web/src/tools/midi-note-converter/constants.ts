export enum InputModeEnum {
  MIDI = 'midi',
  NAME = 'name',
  FREQUENCY = 'frequency',
}

export const MODE_OPTIONS: { label: string; value: InputModeEnum }[] = [
  { label: 'MIDI 编号', value: InputModeEnum.MIDI },
  { label: '音名', value: InputModeEnum.NAME },
  { label: '频率 (Hz)', value: InputModeEnum.FREQUENCY },
];

export const DEFAULT_MIDI_NOTE = 69;

export const DEFAULT_NOTE_NAME = 'A4';

export const DEFAULT_FREQUENCY = 440;

export const DEFAULT_A4_FREQUENCY = 440;

export const OCTAVE_SELECT_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const octave = index - 1;
  return { label: `${octave} 八度（C${octave}–B${octave}）`, value: octave };
});
