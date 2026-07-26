import { Events, MessageFlags, type Client, type Interaction } from 'discord.js';
import { commandMap } from '../commands';
import { handleMenuSelect } from '../commands/catalog';
import { handleQuizInteraction } from '../commands/quiz.command';
import type { ServiceContainer } from '../services';
import { childLogger } from '../utils/logger';

const log = childLogger('interaction');

export function registerInteractionCreate(client: Client, services: ServiceContainer): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // Interactive `/menu` category dropdown.
    if (interaction.isStringSelectMenu()) {
      try {
        await handleMenuSelect(interaction);
      } catch (err) {
        log.error({ err }, 'menu select failed');
      }
      return;
    }

    // Interactive button & modal for `/quiz` (Đuổi hình bắt chữ)
    if (
      (interaction.isButton() && interaction.customId.startsWith('quiz:')) ||
      (interaction.isModalSubmit() && interaction.customId === 'quiz:modal_answer')
    ) {
      try {
        await handleQuizInteraction(interaction);
      } catch (err) {
        log.error({ err }, 'quiz interaction failed');
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    // Fast-path: Defer reply immediately (<20ms) so Discord never shows timeout errors!
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply();
      }
    } catch (err) {
      log.error({ err }, 'failed to defer reply');
    }

    const command = commandMap.get(interaction.commandName);
    if (!command) {
      log.warn({ command: interaction.commandName }, 'received unknown command');
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(`⚠️ Lệnh \`/${interaction.commandName}\` không tồn tại.`);
        }
      } catch {
        // Ignore
      }
      return;
    }

    try {
      await command.execute(interaction, services);
    } catch (err) {
      log.error({ err, command: interaction.commandName }, 'command execution failed');
      const reason = err instanceof Error ? err.message : String(err);
      const message = `⚠️ Lỗi khi xử lý lệnh:\n\`\`\`\n${reason.slice(0, 1800)}\n\`\`\``;
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(message);
        } else {
          await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
        }
      } catch (replyErr) {
        log.error({ err: replyErr }, 'failed to send error reply');
      }
    } finally {
      // Guaranteed safety net: Edit deferred reply if execution completed without replying
      if (interaction.deferred && !interaction.replied) {
        try {
          await interaction.editReply('✅ Lệnh đã hoàn tất.');
        } catch {
          // Ignore
        }
      }
    }
  });
}
