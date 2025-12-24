/**
 * Haptic feedback utilities for mobile interactions
 * Uses the Vibration API when available
 */

const canVibrate = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Light haptic feedback for button taps and selections
 */
export const vibrateLight = (): void => {
  if (canVibrate()) {
    navigator.vibrate(10);
  }
};

/**
 * Medium haptic feedback for form submissions and confirmations
 */
export const vibrateMedium = (): void => {
  if (canVibrate()) {
    navigator.vibrate(30);
  }
};

/**
 * Success haptic pattern for completed actions
 */
export const vibrateSuccess = (): void => {
  if (canVibrate()) {
    navigator.vibrate([10, 50, 20]);
  }
};

/**
 * Error haptic pattern for failed actions
 */
export const vibrateError = (): void => {
  if (canVibrate()) {
    navigator.vibrate([50, 30, 50]);
  }
};

/**
 * Heavy haptic feedback for important actions
 */
export const vibrateHeavy = (): void => {
  if (canVibrate()) {
    navigator.vibrate(50);
  }
};

/**
 * Unified haptic trigger function
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void => {
  switch (type) {
    case 'light':
      vibrateLight();
      break;
    case 'medium':
      vibrateMedium();
      break;
    case 'heavy':
      vibrateHeavy();
      break;
    case 'success':
      vibrateSuccess();
      break;
    case 'error':
      vibrateError();
      break;
  }
};
