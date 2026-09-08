import type { OneItem } from '@/src/types/item';

export const mockItems: OneItem[] = [
  {
    id: 'dentist',
    title: 'Dentist appointment',
    type: 'appointment',
    date: '2026-09-18',
    time: '15:00',
    category: 'Health',
    location: '123 Health Clinic',
    completed: false,
    saved: false,
    sourceType: 'manual',
    tags: ['health'],
    entities: ['dentist'],
    createdAt: '2026-09-08T12:00:00Z',
    updatedAt: '2026-09-08T12:00:00Z'
  },
  {
    id: 'package',
    title: 'Pick up package',
    type: 'task',
    category: 'Errands',
    completed: false,
    saved: false,
    sourceType: 'manual',
    tags: ['errands'],
    entities: ['package'],
    createdAt: '2026-09-08T12:00:00Z',
    updatedAt: '2026-09-08T12:00:00Z'
  },
  {
    id: 'netflix',
    title: 'Cancel Netflix',
    type: 'reminder',
    date: '2026-09-23',
    category: 'Subscription',
    completed: false,
    saved: false,
    sourceType: 'manual',
    tags: ['subscription'],
    entities: ['Netflix'],
    createdAt: '2026-09-08T12:00:00Z',
    updatedAt: '2026-09-08T12:00:00Z'
  }
];
