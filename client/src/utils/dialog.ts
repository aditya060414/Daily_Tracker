import { Capacitor } from '@capacitor/core';
import { Dialog } from '@capacitor/dialog';

/**
 * Show a native dialog alert if on a native platform, otherwise fallback to window.alert.
 */
export const nativeAlert = async (message: string, title: string = 'Alert'): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Dialog.alert({
      title,
      message,
    });
  } else {
    window.alert(message);
  }
};

/**
 * Show a native confirmation dialog if on a native platform, otherwise fallback to window.confirm.
 */
export const nativeConfirm = async (message: string, title: string = 'Confirm'): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Dialog.confirm({
      title,
      message,
    });
    return value;
  } else {
    return window.confirm(message);
  }
};
