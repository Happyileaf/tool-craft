export enum PasswordStrength {
  WEAK = 0,
  MEDIUM = 1,
  STRONG = 2,
}

export const PasswordStrengthLabels = {
  [PasswordStrength.WEAK]: 'weak',
  [PasswordStrength.MEDIUM]: 'medium',
  [PasswordStrength.STRONG]: 'strong',
};
