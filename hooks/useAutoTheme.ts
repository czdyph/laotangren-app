import { useState, useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import SunCalc from 'suncalc';

export type ThemeMode = 'light' | 'dark' | 'auto_system' | 'auto_sun';

export function useAutoTheme(themeMode: ThemeMode, isLoaded: boolean) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        let intervalId: NodeJS.Timeout;

        const evaluateTheme = async () => {
            if (themeMode === 'light') {
                setIsDark(false);
            } else if (themeMode === 'dark') {
                setIsDark(true);
            } else if (themeMode === 'auto_system') {
                // 跟随系统主题
                const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                setIsDark(prefersDark);
            } else if (themeMode === 'auto_sun') {
                // 跟随日出日落
                try {
                    let lat = parseFloat(localStorage.getItem('boba_lat') || '0');
                    let lng = parseFloat(localStorage.getItem('boba_lng') || '0');

                    // 如果没有缓存过经纬度，则请求原生定位
                    if (!lat || !lng) {
                        const position = await Geolocation.getCurrentPosition();
                        lat = position.coords.latitude;
                        lng = position.coords.longitude;
                        // 存入本地，以后再也不用频繁申请定位了
                        localStorage.setItem('boba_lat', lat.toString());
                        localStorage.setItem('boba_lng', lng.toString());
                    }

                    // 核心：使用 SunCalc 纯数学计算当天的日出日落时间
                    const now = new Date();
                    const times = SunCalc.getTimes(now, lat, lng);

                    // 如果当前时间早于日出，或晚于日落，就是黑夜
                    const isNight = now < times.sunrise || now > times.sunset;
                    setIsDark(isNight);
                } catch (error) {
                    // 兜底策略：如果用户拒绝给定位权限，回退到傻瓜式时间判定 (早 6 点到晚 18 点)
                    console.warn("无法获取定位，回退到默认时间判定", error);
                    const hour = new Date().getHours();
                    setIsDark(hour >= 18 || hour < 6);
                }
            }
        };

        // 立即执行一次
        evaluateTheme();

        // 如果处于自动模式，每隔 1 分钟静默轮询一次，一旦到了黄昏，界面自动变黑！
        if (themeMode === 'auto_sun' || themeMode === 'auto_system') {
            intervalId = setInterval(evaluateTheme, 60000);
        }

        // 监听系统级别的深浅色主动切换
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (themeMode === 'auto_system') evaluateTheme();
        };
        mediaQuery.addEventListener('change', handleSystemChange);

        return () => {
            if (intervalId) clearInterval(intervalId);
            mediaQuery.removeEventListener('change', handleSystemChange);
        };
    }, [themeMode, isLoaded]);

    return isDark;
}