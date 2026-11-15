export const SAMPLE_ARP_REQUEST =
  '00 01 08 00 06 04 00 01 00 11 22 33 44 55 C0 A8 01 01 00 00 00 00 00 00 C0 A8 01 02';

export const SAMPLE_ARP_REPLY =
  '00 01 08 00 06 04 00 02 00 11 22 33 44 55 C0 A8 01 01 AA BB CC DD EE FF C0 A8 01 02';

export const SAMPLE_ARP_HEX = [SAMPLE_ARP_REQUEST, SAMPLE_ARP_REPLY];

export const DEFAULT_BUILD = {
  operation: 1,
  senderMac: '00:11:22:33:44:55',
  senderIp: '192.168.1.1',
  targetMac: 'FF:FF:FF:FF:FF:FF',
  targetIp: '192.168.1.2',
};
