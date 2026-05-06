export const id = (value: string): number => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new TypeError('Invalid ID');
  }
  return parsed;
};
