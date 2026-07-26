import type { Command } from './types';
import { askCommand } from './ask.command';
import { codeCommand } from './code.command';
import { summaryCommand } from './summary.command';
import { translateCommand } from './translate.command';
import { configCommand } from './config.command';
import { statsCommand } from './stats.command';
import { resetMemoryCommand } from './reset-memory.command';
import { tarotCommand } from './tarot.command';
import { shipCommand } from './ship.command';
import { ttsCommand } from './tts.command';
import { leaveCommand } from './leave.command';
import { helpCommand } from './help.command';
import { menuCommand } from './menu.command';
import { playCommand } from './play.command';
import { skipCommand } from './skip.command';
import { stopCommand } from './stop.command';
import { pauseCommand } from './pause.command';
import { resumeCommand } from './resume.command';
import { queueCommand } from './queue.command';

/** Ordered list of all slash commands the bot exposes. */
export const commands: Command[] = [
  askCommand,
  codeCommand,
  summaryCommand,
  translateCommand,
  configCommand,
  statsCommand,
  resetMemoryCommand,
  tarotCommand,
  shipCommand,
  ttsCommand,
  leaveCommand,
  helpCommand,
  menuCommand,
  playCommand,
  skipCommand,
  stopCommand,
  pauseCommand,
  resumeCommand,
  queueCommand,
];

/** Fast lookup by command name, used by the interaction handler. */
export const commandMap: Map<string, Command> = new Map(
  commands.map((command) => [command.data.name, command]),
);

export type { Command } from './types';
