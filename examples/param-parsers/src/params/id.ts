export const parser = {
  parse(value: string): number | undefined {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  },
  get(value: number): number {
    return value;
  },
};
