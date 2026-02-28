import type { MissionType } from './types';

export type ComboSequence = {
  name: string;
  nameKo: string;
  missions: MissionType[];
  timeLimitPerMission: number;
};

export const COMBO_SEQUENCES: ComboSequence[] = [
  {
    name: 'Street Fighter',
    nameKo: '스트리트 파이터',
    missions: ['dodge_left', 'punch', 'duck', 'punch', 'jump'],
    timeLimitPerMission: 3,
  },
  {
    name: 'Ninja Reflexes',
    nameKo: '닌자 반사신경',
    missions: ['duck', 'dodge_right', 'throw', 'dodge_left', 'jump'],
    timeLimitPerMission: 2.5,
  },
  {
    name: 'Dance Party',
    nameKo: '댄스 파티',
    missions: ['wave', 'clap', 'jump', 'dodge_left', 'dodge_right', 'clap'],
    timeLimitPerMission: 2.5,
  },
  {
    name: 'Goalkeeper',
    nameKo: '골키퍼',
    missions: ['catch', 'dodge_left', 'catch', 'dodge_right', 'catch', 'jump'],
    timeLimitPerMission: 2.5,
  },
  {
    name: 'Survival',
    nameKo: '서바이벌',
    missions: ['duck', 'jump', 'dodge_left', 'dodge_right', 'duck', 'punch', 'throw', 'clap'],
    timeLimitPerMission: 2,
  },
];
