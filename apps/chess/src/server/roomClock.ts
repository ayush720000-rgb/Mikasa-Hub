import type { RoomManager } from './roomManager';

export function checkClocks(m: RoomManager): void {
  const now = Date.now();
  for (const [code, room] of m.rooms.entries()) {
    if (room.status !== 'in_progress' || !room.gameRules.timerEnabled || !room.lastMoveTimestamp) {
      continue;
    }
    const elapsed = now - room.lastMoveTimestamp;
    const activePlayer = room.turn === 'w' ? room.whitePlayer : room.blackPlayer;
    if (activePlayer && activePlayer.timeLeftMs > 0 && activePlayer.timeLeftMs - elapsed <= 0) {
      activePlayer.timeLeftMs = 0;
      room.status = 'finished';
      room.resolution = 'timeout';
      room.winnerColor = room.turn === 'w' ? 'b' : 'w';
      room.winnerUserId =
        room.turn === 'w' ? room.blackPlayer?.user.id : room.whitePlayer?.user.id;
      m.clearBotTimer(code);
      m.onRoomStateChanged?.(room);
    }
  }
}
