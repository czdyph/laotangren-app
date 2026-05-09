"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Search, Trophy, Palette, Layout, Target, Database, Languages } from "lucide-react";
import { DrinkRecord } from "@/types";
import { getAchievementsData } from "@/utils/helpers";

interface SettingsTabProps {
    records: DrinkRecord[];
    themeMode: string;
    setThemeMode: (val: any) => void;
    prefLanguage: string;
    setPrefLanguage: (val: string) => void;
    themeAccent: string;
    setThemeAccent: (val: string) => void;
    fontScale: string;
    setFontScale: (val: any) => void;
    cardDensity: string;
    setCardDensity: (val: any) => void;
    weekStart: string;
    setWeekStart: (val: any) => void;
    calendarImageMode: string;
    setCalendarImageMode: (val: any) => void;
    defaultTemp: string;
    setDefaultTemp: (val: string) => void;
    defaultSweet: string;
    setDefaultSweet: (val: string) => void;
    weeklyBudget: string;
    setWeeklyBudget: (val: string) => void;
    weeklyCupLimit: string;
    setWeeklyCupLimit: (val: string) => void;
    monthlyBudget: string;
    setMonthlyBudget: (val: string) => void;
    monthlyCupLimit: string;
    setMonthlyCupLimit: (val: string) => void;
    setShowAchievementsModal: (val: boolean) => void;
    setShowAboutUsModal: (val: boolean) => void;
    handleCompressHistory: () => void;
    handleExportData: () => void;
    handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success') => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// 🏷️ 内部子组件：Section 标题 (稍微缩紧了底部的 mb-1.5)
const SectionHeader = ({ icon: Icon, title, subTitle }: { icon: any, title: string, subTitle?: string }) => (
    <div className="flex items-center gap-2 mb-1.5 px-1">
        <Icon size={13} className="text-text-muted" strokeWidth={2.5} />
        <span className="text-[11px] font-black text-text-muted tracking-widest uppercase">{title}</span>
        {subTitle && <span className="text-[10px] text-text-muted/50 ml-auto font-medium">{subTitle}</span>}
    </div>
);

// 🕹️ 内部子组件：iOS 风格分段选择器
const SegmentedControl = ({ options, value, onChange, themeAccent }: { options: { key: string, label: string }[], value: string, onChange: (val: any) => void, themeAccent: string }) => (
    <div className="flex p-1 bg-bg-input rounded-2xl w-full">
        {options.map((opt) => (
            <button
                key={opt.key}
                onClick={() => onChange(opt.key)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${value === opt.key ? 'bg-bg-card shadow-sm text-text-main' : 'text-text-muted hover:text-text-main/70'
                    }`}
                style={value === opt.key ? { color: themeAccent } : {}}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export default function SettingsTab(props: SettingsTabProps) {
    const [settingsSearch, setSettingsSearch] = useState('');
    const [isEditingDefaults, setIsEditingDefaults] = useState(false);

    const {
        records, themeMode, setThemeMode, prefLanguage, setPrefLanguage,
        themeAccent, setThemeAccent, fontScale, setFontScale, cardDensity, setCardDensity,
        weekStart, setWeekStart, calendarImageMode, setCalendarImageMode,
        defaultTemp, setDefaultTemp, defaultSweet, setDefaultSweet,
        weeklyBudget, setWeeklyBudget, weeklyCupLimit, setWeeklyCupLimit,
        monthlyBudget, setMonthlyBudget, monthlyCupLimit, setMonthlyCupLimit,
        setShowAchievementsModal, setShowAboutUsModal,
        handleCompressHistory, handleExportData, handleImportData,
        triggerHaptic, showToast
    } = props;

    const settingMatches = (keywords: string[]) => {
        if (!settingsSearch.trim()) return true;
        const q = settingsSearch.toLowerCase();
        return keywords.some(k => k.toLowerCase().includes(q));
    };

    return (
        // 👇 收紧：space-y-8 改成了 space-y-5，整体模块更紧凑
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-5 pb-36 pt-[calc(env(safe-area-inset-top)+24px)]">

            {/* 1. Header & Search */}
            <div className="space-y-4">
                <h1 className="text-3xl font-black tracking-tight text-text-main">设置</h1>
                <div className="relative group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:theme-text transition-colors" />
                    <input
                        type="text"
                        value={settingsSearch}
                        onChange={(e) => setSettingsSearch(e.target.value)}
                        placeholder="搜索功能或偏好..."
                        className="w-full bg-bg-card border border-border-main/50 rounded-2xl pl-11 pr-4 py-3 text-[13px] font-bold focus:outline-none focus:ring-2 focus:ring-theme-color/20 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* 2. 荣誉勋章入口 (黑金 VIP 黑卡质感) */}
            {settingMatches(['achievements', 'medal', '荣誉', '勋章', '成就']) && (
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAchievementsModal(true)}
                    className="w-full relative rounded-3xl p-5 cursor-pointer overflow-hidden border border-[#D2B48C]/20 shadow-[0_12px_30px_-10px_rgba(210,180,140,0.15)] group"
                    style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #000000 100%)' }}
                >
                    {/* 恢复真实的动态计算逻辑 */}
                    {(() => {
                        const { achievementsList } = getAchievementsData(records);
                        const unlockedCount = achievementsList.filter(a => a.isUnlocked).length;
                        const totalCount = achievementsList.length;
                        const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

                        return (
                            <>
                                {/* 1. 左下右上鎏金光晕 */}
                                <div className="absolute -top-16 -right-10 w-40 h-40 bg-[#D2B48C]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#D2B48C]/25 transition-all duration-700" />
                                <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-[#A58E72]/10 rounded-full blur-3xl pointer-events-none" />

                                {/* 2. 奢华扫光动效 (Shimmering Light Sweep) */}
                                <motion.div
                                    animate={{ x: ['-200%', '200%'] }}
                                    transition={{ duration: 3, ease: "linear", repeat: Infinity, repeatDelay: 2.5 }}
                                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#D2B48C]/10 to-transparent skew-x-[-30deg] pointer-events-none"
                                />

                                <div className="flex flex-col relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            {/* 金属渐变文字 */}
                                            <h3 className="text-[20px] font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#FFF5D1] via-[#D2B48C] to-[#8E7558]">
                                                老糖人荣誉勋章
                                            </h3>
                                            <p className="text-[9px] font-bold text-[#A58E72] tracking-[0.25em] mt-1 uppercase opacity-80">
                                                Milk Tea Milestones
                                            </p>
                                        </div>
                                        {/* 悬浮王冠与微动效 */}
                                        <div className="relative group-hover:-translate-y-1 transition-transform duration-500">
                                            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full scale-150" />
                                            <div className="text-4xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transform group-hover:rotate-12 transition-transform duration-500">
                                                👑
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. 玻璃态仪表盘进度条 */}
                                    <div className="bg-[#D2B48C]/10 backdrop-blur-md rounded-2xl p-3 flex flex-col gap-2.5 border border-[#D2B48C]/10 shadow-inner">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-1.5">
                                                <Trophy size={13} className="text-[#D2B48C]" />
                                                <span className="text-[10px] font-bold text-[#D2B48C] tracking-widest">典藏进度</span>
                                            </div>
                                            <span className="text-[12px] font-black text-[#D2B48C]">
                                                {unlockedCount} <span className="text-[9px] text-[#A58E72] font-bold">/ {totalCount}</span>
                                            </span>
                                        </div>
                                        {/* 深邃刻槽 */}
                                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] relative">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 1.5, type: 'spring', delay: 0.2 }}
                                                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#8E7558] via-[#D2B48C] to-[#FFF5D1] shadow-[0_0_10px_rgba(210,180,140,0.8)]"
                                            >
                                                {/* 进度条末端高光点 (模拟发光二极管) */}
                                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full blur-[2px] opacity-80" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </motion.div>
            )}

            {/* 3. 视觉与外观 Section */}
            <section className={settingMatches(['theme', 'dark', 'font', 'density', '外观', '深色', '字体', '密度']) ? '' : 'hidden'}>
                <SectionHeader icon={Palette} title="视觉与布局" />
                <div className="bg-bg-card rounded-3xl shadow-sm border border-border-main/40 overflow-hidden">
                    {/* 外观模式 */}
                    <div className="p-3">
                        <label className="text-xs font-bold text-text-main mb-2 block px-1">外观模式</label>
                        {/* 🚀 核心修改：将 grid-cols-4 改为 grid-cols-3，让 3 个按钮完美平铺 */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { key: 'light', label: '浅色', icon: '☀️' },
                                { key: 'dark', label: '深色', icon: '🌙' },
                                { key: 'auto_system', label: '系统', icon: '📱' }
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setThemeMode(item.key)}
                                    className={`flex flex-col items-center py-2 rounded-xl border-2 transition-all ${themeMode === item.key ? 'theme-border bg-bg-app' : 'border-transparent bg-bg-input/50'
                                        }`}
                                >
                                    <span className="text-lg mb-0.5">{item.icon}</span>
                                    <span className={`text-[9px] font-bold ${themeMode === item.key ? 'theme-text' : 'text-text-muted'}`}>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* 主题色 */}
                    <div className="px-4 py-3 flex items-center justify-between border-t border-border-main/20">
                        <span className="text-xs font-bold text-text-main">主题色</span>
                        <div className="flex gap-2">
                            {['#8E7558', '#1D7AFC', '#0D9F6E', '#D9487D', '#F59E0B'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setThemeAccent(c)}
                                    className={`w-5 h-5 rounded-full transition-all ${themeAccent === c ? 'ring-2 ring-offset-2 ring-offset-bg-card' : 'scale-90 opacity-60'}`}
                                    style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                                />
                            ))}
                        </div>
                    </div>
                    {/* 字体大小 */}
                    <div className="px-4 py-3 border-t border-border-main/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-text-main">全局字号</span>
                        </div>
                        <SegmentedControl value={fontScale} onChange={setFontScale} themeAccent={themeAccent} options={[{ key: 'small', label: '小' }, { key: 'medium', label: '中' }, { key: 'large', label: '大' }]} />
                    </div>
                </div>
            </section>

            {/* 4. 饮茶偏好 Section */}
            <section className={settingMatches(['calendar', 'temp', 'sweet', 'week', '偏好', '起始日', '甜度', '温度']) ? '' : 'hidden'}>
                <SectionHeader icon={Layout} title="老糖人偏爱" />
                <div className="bg-bg-card rounded-3xl p-1.5 shadow-sm border border-border-main/40">
                    <div className="px-3 py-2 space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-text-main">温度 / 甜度</label>
                                <button onClick={() => setIsEditingDefaults(!isEditingDefaults)} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-bg-input active:scale-95" style={{ color: themeAccent }}>
                                    {isEditingDefaults ? '收起' : '编辑'}
                                </button>
                            </div>

                            {isEditingDefaults ? (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 p-2 bg-bg-app rounded-xl border border-border-main/40">
                                    <div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['热', '正常冰', '少冰', '去冰'].map(temp => (
                                                <button key={temp} onClick={() => { setDefaultTemp(temp); triggerHaptic('light'); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${defaultTemp === temp ? 'bg-bg-card shadow-sm text-text-main ring-1' : 'bg-transparent text-text-muted hover:bg-bg-input'}`} style={defaultTemp === temp ? { color: themeAccent, ringColor: themeAccent, '--tw-ring-color': themeAccent } as React.CSSProperties : {}}>{temp}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border-t border-border-main/30 pt-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {['不另外加糖', '三分糖', '五分糖', '七分糖', '标准糖'].map(sweet => (
                                                <button key={sweet} onClick={() => { setDefaultSweet(sweet); triggerHaptic('light'); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${defaultSweet === sweet ? 'bg-bg-card shadow-sm text-text-main ring-1' : 'bg-transparent text-text-muted hover:bg-bg-input'}`} style={defaultSweet === sweet ? { color: themeAccent, ringColor: themeAccent, '--tw-ring-color': themeAccent } as React.CSSProperties : {}}>{sweet}</button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex gap-1.5 cursor-pointer group w-fit" onClick={() => setIsEditingDefaults(true)}>
                                    <div className="px-2.5 py-1 bg-bg-input rounded-lg text-[11px] font-bold text-text-main shrink-0 border border-border-main/30 shadow-sm">{defaultTemp}</div>
                                    <div className="px-2.5 py-1 bg-bg-input rounded-lg text-[11px] font-bold text-text-main shrink-0 border border-border-main/30 shadow-sm">{defaultSweet}</div>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-border-main/20 pt-2">
                            <label className="text-xs font-bold text-text-main mb-2 block">日历显示模式</label>
                            <SegmentedControl value={calendarImageMode} onChange={setCalendarImageMode} themeAccent={themeAccent} options={[{ key: 'brand', label: '品牌 Logo' }, { key: 'upload', label: '奶茶贴纸' }]} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. 自律与目标 Section */}
            <section className={settingMatches(['budget', 'limit', '自律', '预算', '目标']) ? '' : 'hidden'}>
                <SectionHeader icon={Target} title="自律管家" subTitle="可别真戒了！！！" />
                <div className="bg-bg-card rounded-3xl p-4 shadow-sm border border-border-main/40 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-text-muted/70 tracking-widest uppercase ml-1">周预算 (￥)</span>
                            <input type="number" value={weeklyBudget} onChange={e => setWeeklyBudget(e.target.value)} className="w-full bg-bg-input rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 theme-ring/20 transition-all" placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-text-muted/70 tracking-widest uppercase ml-1">周杯数 (杯)</span>
                            <input type="number" value={weeklyCupLimit} onChange={e => setWeeklyCupLimit(e.target.value)} className="w-full bg-bg-input rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 theme-ring/20 transition-all" placeholder="0" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-main/30">
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-text-muted/70 tracking-widest uppercase ml-1">月预算 (￥)</span>
                            <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="w-full bg-bg-input rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 theme-ring/20 transition-all" placeholder="0.0" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-black text-text-muted/70 tracking-widest uppercase ml-1">月杯数 (杯)</span>
                            <input type="number" value={monthlyCupLimit} onChange={e => setMonthlyCupLimit(e.target.value)} className="w-full bg-bg-input rounded-xl px-3 py-2 text-sm font-black focus:outline-none focus:ring-2 theme-ring/20 transition-all" placeholder="0" />
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. 数据管理 Section */}
            <section className={settingMatches(['backup', 'export', 'import', 'language', '数据', '语言', '备份', '瘦身']) ? '' : 'hidden'}>
                <SectionHeader icon={Database} title="数据与系统" />
                <div className="bg-bg-card rounded-3xl overflow-hidden shadow-sm border border-border-main/40">
                    <div className="px-4 py-3 flex items-center justify-between bg-bg-input/20">
                        <div className="flex items-center gap-2">
                            <Languages size={14} className="text-text-muted" />
                            <span className="text-xs font-bold text-text-main">界面语言</span>
                        </div>
                        <select value={prefLanguage} onChange={(e) => setPrefLanguage(e.target.value)} className="bg-transparent text-[13px] font-black theme-text focus:outline-none">
                            <option value="中文">中文</option>
                            <option value="English">English</option>
                        </select>
                    </div>
                    <div className="px-3 py-3 grid grid-cols-2 gap-2 border-t border-border-main/20">
                        <button onClick={handleExportData} className="py-2.5 rounded-xl bg-bg-input text-text-main font-black text-[11px] hover:theme-bg hover:text-white transition-all active:scale-95">导出备份</button>
                        <button onClick={() => { }} className="py-2.5 rounded-xl bg-bg-input text-text-main font-black text-[11px] relative overflow-hidden active:scale-95 transition-all">
                            恢复数据
                            <input type="file" accept=".zip" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportData} />
                        </button>
                    </div>
                    <button onClick={handleCompressHistory} className="w-full py-3 text-center text-[10px] font-black text-text-muted/60 border-t border-border-main/20 hover:text-text-main transition-colors">
                        执行空间瘦身 (压缩历史图片)
                    </button>
                </div>
            </section>

            {/* 7. Footer */}
            <div className="flex flex-col items-center pt-2 pb-6 opacity-40">
                <button onClick={() => setShowAboutUsModal(true)} className="flex items-center gap-1.5 mb-1.5">
                    <Coffee size={12} />
                    <span className="text-[11px] font-black tracking-tighter italic">Sugar Ultra V1.0.0</span>
                </button>
                <span className="text-[8px] font-bold tracking-[0.3em] uppercase">Designed with czdyph</span>
            </div>
        </motion.div>
    );
}