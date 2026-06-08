export const SERVICE_IDS = ['haircut', 'beard', 'haircut-beard', 'kids', 'styling'] as const
export type ServiceId = (typeof SERVICE_IDS)[number]

export const TOKEN_STATUSES = ['waiting', 'called', 'serving', 'completed', 'cancelled', 'skipped'] as const
export type TokenStatus = (typeof TOKEN_STATUSES)[number]

export const SLOT_STATUSES = ['confirmed', 'cancelled', 'completed'] as const
export type SlotStatus = (typeof SLOT_STATUSES)[number]
