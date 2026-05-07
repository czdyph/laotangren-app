import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export function useImmersiveStatusBar(isDark: boolean, isLoaded: boolean) {
    useEffect(() => {
        if (!isLoaded) return;

        const setup = async () => {
            // 1. 基础 DOM 染色
            if (typeof document !== 'undefined') {
                const bgColor = isDark ? '#1A1A1A' : '#F8F7F4';
                document.documentElement.style.backgroundColor = bgColor;
                document.body.style.backgroundColor = bgColor;
                isDark ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
            }

            if (Capacitor.isNativePlatform()) {
                const physicalBgColor = isDark ? '#1A1A1A' : '#F8F7F4';
                try {
                    if (Capacitor.getPlatform() === 'android') {
                        await StatusBar.setOverlaysWebView({ overlay: false });
                        await StatusBar.setBackgroundColor({ color: physicalBgColor });
                    } else {
                        await StatusBar.setOverlaysWebView({ overlay: true });
                    }
                    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
                } catch (e) { console.warn(e); }
            }
        };

        setup();
    }, [isDark, isLoaded]);
}