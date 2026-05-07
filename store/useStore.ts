import { create } from 'zustand';
import localforage from 'localforage';
import { DrinkRecord } from '@/types';
import { ThemeMode } from '@/hooks/useAutoTheme';

interface AppState {
    records: DrinkRecord[];
    isLoaded: boolean;
    themeMode: ThemeMode;
    themeAccent: string;
    prefLanguage: string;
    defaultTemp: string;
    defaultSweet: string;
    weeklyBudget: string;
    weeklyCupLimit: string;
    monthlyBudget: string;
    monthlyCupLimit: string;
    fontScale: 'small' | 'medium' | 'large';
    cardDensity: 'compact' | 'comfortable';
    weekStart: 'sunday' | 'monday';
    calendarImageMode: 'brand' | 'upload';

    initialize: () => Promise<void>;
    setRecords: (records: DrinkRecord[]) => void;
    setThemeMode: (mode: ThemeMode) => void;
    updateSetting: (key: string, value: string) => void;

}

export const useStore = create<AppState>((set) => ({
    records: [],
    isLoaded: false,
    themeMode: 'light',
    themeAccent: '#8E7558',
    prefLanguage: '中文',
    defaultTemp: '正常冰',
    defaultSweet: '标准糖',
    weeklyBudget: '',
    weeklyCupLimit: '',
    monthlyBudget: '',
    monthlyCupLimit: '',
    fontScale: 'medium',
    cardDensity: 'comfortable',
    weekStart: 'sunday',
    calendarImageMode: 'brand',

    // 🚀 一键初始化所有数据
    initialize: async () => {
        if (typeof window === 'undefined') return;
        const [storedRecords, storedThemeMode] = await Promise.all([
            localforage.getItem('boba_records'),
            localStorage.getItem('boba_themeMode')
        ]);
        const settings = {
            themeMode: (storedThemeMode as ThemeMode) || 'light',
            themeAccent: localStorage.getItem('boba_themeAccent') || '#8E7558',
            prefLanguage: localStorage.getItem('boba_prefLanguage') || '中文',
            defaultTemp: localStorage.getItem('boba_defaultTemp') || '正常冰',
            defaultSweet: localStorage.getItem('boba_defaultSweet') || '标准糖',
            weeklyBudget: localStorage.getItem('boba_weeklyBudget') || '',
            weeklyCupLimit: localStorage.getItem('boba_weeklyCupLimit') || '',
            monthlyBudget: localStorage.getItem('boba_monthlyBudget') || '',
            monthlyCupLimit: localStorage.getItem('boba_monthlyCupLimit') || '',
            fontScale: (localStorage.getItem('boba_fontScale') as any) || 'medium',
            cardDensity: (localStorage.getItem('boba_cardDensity') as any) || 'comfortable',
            weekStart: (localStorage.getItem('boba_weekStart') as any) || 'sunday',
            calendarImageMode: (localStorage.getItem('boba_calendarImageMode') as any) || 'brand',
        };
        set({ records: (storedRecords as DrinkRecord[]) || [], ...settings, isLoaded: true });
    },

    // 💾 自动持久化的修改器
    setRecords: (records) => {
        set({ records });
        localforage.setItem('boba_records', records);
    },
    setThemeMode: (themeMode) => {
        set({ themeMode });
        localStorage.setItem('boba_themeMode', themeMode);
    },
    updateSetting: (key, value) => {
        set({ [key]: value } as any);
        localStorage.setItem(`boba_${key}`, value);
    }
}));