/**
 * Telegram WebApp Hook
 * Provides integration with Telegram Mini App API
 */
import { useEffect, useState, useCallback } from 'react';

// Telegram WebApp type definitions
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          receiver?: any;
          chat?: any;
          chat_type?: string;
          chat_instance?: string;
          start_param?: string;
          can_send_after?: number;
          auth_date?: number;
          hash?: string;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
        sendData: (data: string) => void;
        switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
        openLink: (url: string, options?: { try_instant_view: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        shareToStory: (media_url: string, params?: any) => void;
      };
    };
  }
}

interface TelegramTheme {
  bg_color: string;
  text_color: string;
  hint_color: string;
  button_color: string;
  button_text_color: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  isExpanded: boolean;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    receiver?: any;
    chat?: any;
    chat_type?: string;
    chat_instance?: string;
    start_param?: string;
    can_send_after?: number;
    auth_date?: number;
    hash?: string;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  shareToStory: (media_url: string, params?: any) => void;
}

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [theme, setTheme] = useState<TelegramTheme | null>(null);
  const [userData, setUserData] = useState<{id: number; first_name: string; last_name?: string; username?: string; language_code?: string; is_premium?: boolean} | null>(null);

  useEffect(() => {
    // Check if we're running inside Telegram
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      setTg(webApp);
      setIsTelegram(true);

      // Tell Telegram we're ready
      webApp.ready();
      webApp.expand();

      // Extract theme
      const tgTheme: TelegramTheme = {
        bg_color: webApp.themeParams.bg_color || '#ffffff',
        text_color: webApp.themeParams.text_color || '#000000',
        hint_color: webApp.themeParams.hint_color || '#999999',
        button_color: webApp.themeParams.button_color || '#3390ec',
        button_text_color: webApp.themeParams.button_text_color || '#ffffff',
      };
      setTheme(tgTheme);

      // Extract user data
      if (webApp.initDataUnsafe.user) {
        setUserData(webApp.initDataUnsafe.user);
      }

      // Apply Telegram theme to CSS variables
      document.documentElement.style.setProperty('--tg-bg-color', tgTheme.bg_color);
      document.documentElement.style.setProperty('--tg-text-color', tgTheme.text_color);
      document.documentElement.style.setProperty('--tg-hint-color', tgTheme.hint_color);
      document.documentElement.style.setProperty('--tg-button-color', tgTheme.button_color);
      document.documentElement.style.setProperty('--tg-button-text-color', tgTheme.button_text_color);

      console.log('📱 Telegram Mini App initialized');
      console.log('User:', webApp.initDataUnsafe.user);
      console.log('Theme:', tgTheme);
    }
  }, []);

  // Haptic feedback helper
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'select') => {
    if (!tg?.HapticFeedback) return;

    switch (type) {
      case 'light':
      case 'medium':
      case 'heavy':
        tg.HapticFeedback.impactOccurred(type);
        break;
      case 'success':
      case 'error':
      case 'warning':
        tg.HapticFeedback.notificationOccurred(type);
        break;
      case 'select':
        tg.HapticFeedback.selectionChanged();
        break;
    }
  }, [tg]);

  // Show/hide MainButton
  const showMainButton = useCallback((text: string, onClick: () => void) => {
    if (!tg?.MainButton) return;

    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
  }, [tg]);

  const hideMainButton = useCallback(() => {
    if (!tg?.MainButton) return;
    tg.MainButton.hide();
  }, [tg]);

  // Show/hide BackButton
  const showBackButton = useCallback((onClick: () => void) => {
    if (!tg?.BackButton) return;
    tg.BackButton.show();
    tg.BackButton.onClick(onClick);
  }, [tg]);

  const hideBackButton = useCallback(() => {
    if (!tg?.BackButton) return;
    tg.BackButton.hide();
  }, [tg]);

  return {
    tg,
    isTelegram,
    theme,
    userData,
    haptic,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
  };
}
