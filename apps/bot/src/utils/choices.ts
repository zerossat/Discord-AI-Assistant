import { COMMON_LANGUAGES, SUPPORTED_AI_MODELS } from '@daa/shared';

export const LANGUAGE_CHOICES = Object.entries(COMMON_LANGUAGES).map(([value, name]) => ({
  name: `${name} (${value})`,
  value,
}));

export const SOURCE_LANGUAGE_CHOICES = [
  { name: 'Auto-detect', value: 'auto' },
  ...LANGUAGE_CHOICES,
];

export const MODEL_CHOICES = SUPPORTED_AI_MODELS.map((model) => ({ name: model, value: model }));
