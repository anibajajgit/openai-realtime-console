
// Utility function for conditional className joining
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
