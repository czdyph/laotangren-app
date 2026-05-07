import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { getBrandKey, getBrandLogoFile, isExportableImageSrc } from '../utils/helpers';
import { DrinkRecord } from '../types';

export function useWidgetSync(
    records: DrinkRecord[],
    weeklyBudget: string,
    weekStart: string,
    calendarImageMode: string,
    isLoaded: boolean
) {
    useEffect(() => {
        if (!isLoaded) return;
        const syncWidgetData = async () => {
            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const today = now.getDate();

                // --- 1. 计算当月数据 ---
                const currentMonthRecords = records.filter(r => r.month === month && r.year === year);
                const mCost = currentMonthRecords.reduce((sum, r) => sum + r.cost, 0);

                const heatMapMap = new Map();
                currentMonthRecords.forEach(r => {
                    heatMapMap.set(r.day, (heatMapMap.get(r.day) || 0) + 1);
                });
                const heatMap = Array.from(heatMapMap.entries()).map(([day, count]) => ({ day, count }));

                // --- 2. 计算本周数据 ---
                const dayOfW = now.getDay();
                let daysToSubtract = dayOfW;
                if (weekStart === 'monday') {
                    daysToSubtract = dayOfW === 0 ? 6 : dayOfW - 1;
                }
                const startOfWeek = new Date(year, month, today - daysToSubtract);
                const endOfWeek = new Date(year, month, today - daysToSubtract + 6);

                const currentWeekRecords = records.filter(r => {
                    const d = new Date(r.year, r.month, r.day);
                    return d >= startOfWeek && d <= endOfWeek;
                });

                const wCost = currentWeekRecords.reduce((sum, r) => sum + r.cost, 0);

                // 🌟 【核心修改 1】：把计算出的动态图片写入 Map
                const timelineMap = new Map();
                currentWeekRecords.forEach(r => {
                    const d = new Date(r.year, r.month, r.day);

                    // 🧠 核心：根据用户的设置，决定这里传递什么图片给 Android
                    let finalImage = "";
                    const brandKey = getBrandKey(r.brand || "");
                    const logoFile = brandKey ? getBrandLogoFile(brandKey) : null;
                    const shouldShowBrandLogo = calendarImageMode === 'brand' && Boolean(logoFile);

                    if (shouldShowBrandLogo) {
                        finalImage = `/logos/${logoFile}`; // 品牌模式：传相对路径
                    } else if (isExportableImageSrc(r.imageUrl)) {
                        finalImage = r.imageUrl; // 贴纸模式：传庞大的 Base64 字符串
                    } else if (logoFile) {
                        finalImage = `/logos/${logoFile}`; // 兜底：还是传品牌
                    }

                    timelineMap.set(d.getDate(), { isHit: true, imageUrl: finalImage });
                });

                // 🌟 【核心修改 2】：生成包含图片地址的最近7天时间线
                const timeline = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(startOfWeek);
                    d.setDate(d.getDate() + i);
                    const dayData = timelineMap.get(d.getDate());
                    timeline.push({
                        dayOfWeek: i + 1,
                        date: d.getDate(),
                        isHit: !!dayData,
                        imageUrl: dayData ? dayData.imageUrl : ""
                    });
                }

                // --- 3. 构造 JSON 数据 ---
                const widgetData = {
                    monthlyData: { month: month + 1, totalCost: parseFloat(mCost.toFixed(2)), totalCups: currentMonthRecords.length, heatMap: heatMap },
                    weeklyData: { currentCost: parseFloat(wCost.toFixed(2)), limit: parseFloat(weeklyBudget) || 0, timeline: timeline }
                };

                // --- 4. 写入 Android 底层 ---
                await Preferences.set({ key: 'SUGAR_WIDGET_DATA', value: JSON.stringify(widgetData) });

                console.log('✅ 桌面小组件数据已静默同步');
            } catch (error) {
                console.warn('桌面小组件同步跳过 (当前可能非 Android 环境)');
            }
        };

        syncWidgetData();
        // 🌟 【核心修改 3】：必须把 calendarImageMode 放入依赖数组，这样用户一切换设置，桌面立刻生效！
    }, [records, weeklyBudget, weekStart, calendarImageMode, isLoaded]);
}