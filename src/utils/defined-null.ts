export const isDefinedAndNotNull = (value: any): boolean =>
  typeof value !== 'undefined' && value !== null;

export const isNullOrUndefined = (value: any): boolean =>
  typeof value === 'undefined' || value === null;
