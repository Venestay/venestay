/**
 * Normaliza un string eliminando acentos y convirtiéndolo a minúsculas
 * para comparaciones robustas.
 */
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};
