import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { ServiceContainer } from '../services';

/**
 * The minimal shape we need from a slash-command builder. All discord.js
 * builders (with options, subcommands, etc.) satisfy this structurally, so a
 * single `Command` type works for every command without union gymnastics.
 */
export interface SlashCommandData {
  name: string;
  toJSON: () => RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export interface Command {
  data: SlashCommandData;
  execute: (
    interaction: ChatInputCommandInteraction,
    services: ServiceContainer,
  ) => Promise<void>;
}
