import type { RelationshipStage } from '@/types/chat'

export function calculateRelationshipStage(userMessageCount: number): RelationshipStage {
  if (userMessageCount <= 2) return 'ice_breaking'
  if (userMessageCount <= 5) return 'familiar_flirting'
  return 'intimate_company'
}
