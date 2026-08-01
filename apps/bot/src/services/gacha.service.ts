import type { ImageService } from './image.service';
import type { UserRepository } from '../database/repositories/user.repository';
import type { GachaCard } from '@daa/shared';
import { childLogger } from '../utils/logger';

const log = childLogger('gacha-service');

const CARD_POOL = [
  {
    name: 'Kẻ Huỷ Diệt Cyber',
    rarity: 'Legendary' as const,
    prompt: 'epic golden cybernetic robotic warlord with glowing energy sword',
    atk: 95,
    def: 88,
    hp: 1200,
    desc: 'Bá chủ Đấu Trường Cyberpunk với sức mạnh hủy diệt.',
  },
  {
    name: 'Phượng Hoàng Lửa Cổ Đại',
    rarity: 'Legendary' as const,
    prompt: 'legendary flaming phoenix bird rising from golden flames and ashes',
    atk: 98,
    def: 80,
    hp: 1100,
    desc: 'Linh vật bất tử hồi sinh từ tàn than của ngọn lửa cổ xưa.',
  },
  {
    name: 'Phù Thủy Ánh Sáng',
    rarity: 'Epic' as const,
    prompt: 'beautiful female light sorceress casting radiant white magic spells',
    atk: 85,
    def: 75,
    hp: 850,
    desc: 'Nữ đại pháp sư làm chủ phép thuật ánh sáng thiêng liêng.',
  },
  {
    name: 'Thần Thú Cáo Cửu Vĩ',
    rarity: 'Epic' as const,
    prompt: 'mythical nine tailed fox with glowing blue spirit tails in mystical forest',
    atk: 88,
    def: 70,
    hp: 900,
    desc: 'Linh miêu huyền thoại với 9 chiếc đuôi chứa đầy linh khí.',
  },
  {
    name: 'Chiến Binh Mecha Vàng',
    rarity: 'Rare' as const,
    prompt: 'sleek silver and gold mecha warrior standing in futuristic hangar',
    atk: 72,
    def: 85,
    hp: 750,
    desc: 'Chiến giáp công nghệ cao với lớp giáp hợp kim kiên cố.',
  },
  {
    name: 'Cung Thủ Tinh Tú',
    rarity: 'Rare' as const,
    prompt: 'anime elf archer pulling a bow made of starlight in a starry night sky',
    atk: 78,
    def: 60,
    hp: 680,
    desc: 'Cung thủ tinh linh hạ gục mục tiêu bằng mũi tên ánh sao.',
  },
  {
    name: 'Hiệp Sĩ Mèo Trắng',
    rarity: 'Common' as const,
    prompt: 'cute cat wearing silver knight armor holding a small sword',
    atk: 50,
    def: 55,
    hp: 500,
    desc: 'Chú mèo dũng cảm khoác áo giáp bảo vệ công lý.',
  },
  {
    name: 'Chú Thỏ Ma Thuật',
    rarity: 'Common' as const,
    prompt: 'cute magical rabbit with top hat and glowing magic wand',
    atk: 45,
    def: 48,
    hp: 480,
    desc: 'Thỏ ngọc biểu diễn phép thuật với chiếc mũ kỳ diệu.',
  },
];

export class GachaService {
  constructor(
    private readonly imageService: ImageService,
    private readonly userRepo: UserRepository,
  ) {}

  async rollGacha(
    discordId: string,
    username: string,
  ): Promise<{ card: GachaCard; isCooldown: boolean; hoursRemaining?: number }> {
    const user = await this.userRepo.findByDiscordId(discordId);

    // Cooldown check: 20 hours per daily roll
    if (user?.lastGachaAt) {
      const lastRoll = new Date(user.lastGachaAt);
      const diffHours = (Date.now() - lastRoll.getTime()) / (1000 * 60 * 60);
      if (diffHours < 20) {
        return {
          card: null as any,
          isCooldown: true,
          hoursRemaining: Math.ceil(20 - diffHours),
        };
      }
    }

    // Roll random rarity based on weights (Legendary 5%, Epic 15%, Rare 30%, Common 50%)
    const rand = Math.random() * 100;
    let targetRarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
    if (rand < 5) targetRarity = 'Legendary';
    else if (rand < 20) targetRarity = 'Epic';
    else if (rand < 50) targetRarity = 'Rare';

    const eligibleCards = CARD_POOL.filter((c) => c.rarity === targetRarity);
    const template =
      eligibleCards[Math.floor(Math.random() * eligibleCards.length)] ||
      CARD_POOL[CARD_POOL.length - 1]!;

    const imageRes = await this.imageService.generateImage({ prompt: template.prompt });

    const newCard: GachaCard = {
      id: `card_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: template.name,
      rarity: template.rarity,
      imageUrl: imageRes.imageUrl,
      atk: template.atk + Math.floor(Math.random() * 10),
      def: template.def + Math.floor(Math.random() * 10),
      hp: template.hp + Math.floor(Math.random() * 50),
      description: template.desc,
      createdAt: new Date().toISOString(),
    };

    await this.userRepo.addGachaCard(discordId, username, newCard);

    return {
      card: newCard,
      isCooldown: false,
    };
  }
}
