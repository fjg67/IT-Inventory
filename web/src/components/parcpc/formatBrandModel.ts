export function formatBrandModel(brand: string | null, model: string | null): string {
  const brandLabel = brand?.trim().replace(/\s+/g, ' ') ?? '';
  const modelLabel = model?.trim().replace(/\s+/g, ' ') ?? '';
  if (!brandLabel) return modelLabel;
  if (!modelLabel) return brandLabel;

  const prefix = brandLabel.replace(/\s/g, '').split('')
    .map((character) => character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*');
  const modelWithoutBrand = modelLabel.replace(new RegExp(`^${prefix}`, 'i'), '').trimStart();
  return `${brandLabel} ${modelWithoutBrand}`.trimEnd();
}
