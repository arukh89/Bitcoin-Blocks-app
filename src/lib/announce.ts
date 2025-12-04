import type { ChatMessage } from '@/types/game'
import { isAdminAddress } from './admin'

export type AnnounceDeps = {
  addChatMessage: (msg: ChatMessage) => Promise<void>
  getBool: (k: string, d: boolean) => boolean
}

export async function announceSystemMessage(
  message: string,
  currentUser: { address: string; username: string; pfpUrl: string } | null,
  deps: AnnounceDeps
): Promise<void> {
  if (!currentUser) return
  if (!isAdminAddress(currentUser.address)) return

  const requiresFid = deps.getBool('admin_announce_requires_fid', true)
  if (requiresFid && !currentUser.address.startsWith('fid-')) return

  const chatMsg: ChatMessage = {
    id: `sys-${Date.now()}`,
    roundId: 'global',
    address: currentUser.address,
    username: currentUser.username,
    message,
    pfpUrl: currentUser.pfpUrl,
    timestamp: Date.now(),
    type: 'system'
  }
  await deps.addChatMessage(chatMsg)
}
