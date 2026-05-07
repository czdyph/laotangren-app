"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Share, Coffee, Flame, X } from "lucide-react";
import { DrinkRecord, BrandMetricItem } from "../types";
import { getBrandColor, getReceiptTitle, isExportableImageSrc } from "../utils/helpers";

interface StatsTabProps {
    records: DrinkRecord[];
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    prefLanguage: string;
    themeAccent: string;
    weekStart: string;
    weeklyBudget: string;
    weeklyCupLimit: string;
    monthlyBudget: string;
    monthlyCupLimit: string;
    triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success') => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    handleSaveReceipt: (ref: React.RefObject<HTMLDivElement | null>) => void;
    handleShareReceipt: (ref: React.RefObject<HTMLDivElement | null>) => void;
    // 👇 接收主页面传来的状态
    showStatsReceipt: boolean;
    setShowStatsReceipt: (val: boolean) => void;
    showStatsPoster: boolean;
    setShowStatsPoster: (val: boolean) => void;
    statsSelectedRecord: DrinkRecord | null;
    setStatsSelectedRecord: (val: DrinkRecord | null) => void;
}

export default function StatsTab(props: StatsTabProps) {
    const {
        records, currentDate, setCurrentDate, prefLanguage, themeAccent,
        weekStart, weeklyBudget, weeklyCupLimit, monthlyBudget, monthlyCupLimit,
        triggerHaptic, showToast, handleSaveReceipt, handleShareReceipt,
        showStatsReceipt, setShowStatsReceipt, showStatsPoster, setShowStatsPoster,
        statsSelectedRecord, setStatsSelectedRecord
    } = props;

    // 内部只保留 UI 维度的状态
    const [statPeriod, setStatPeriod] = React.useState<'week' | 'month' | 'year'>('month');
    const [brandDonutMode, setBrandDonutMode] = React.useState<'cups' | 'cost'>('cups');
    const [statAnimationKey, setStatAnimationKey] = React.useState(0);
    
    const receiptCardRef = useRef<HTMLDivElement>(null);
    const posterRef = useRef<HTMLDivElement>(null);

    const handlePrevStatPeriod = () => {
        if (statPeriod === 'week') { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7)); return; }
        if (statPeriod === 'month') { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); return; }
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()));
    };

    const handleNextStatPeriod = () => {
        if (statPeriod === 'week') { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7)); return; }
        if (statPeriod === 'month') { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); return; }
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()));
    };

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    const currentMonthRecords = records.filter(r => r.month === currentMonth && r.year === currentYear);

    const dayOfW = currentDate.getDay();
    let daysToSubtractForWeek = dayOfW;
    if (weekStart === 'monday') { daysToSubtractForWeek = dayOfW === 0 ? 6 : dayOfW - 1; }
    const startOfWeek = new Date(currentYear, currentMonth, currentDay - daysToSubtractForWeek);
    const endOfWeek = new Date(currentYear, currentMonth, currentDay - daysToSubtractForWeek + 6);

    let statRecords: DrinkRecord[] = [];
    let statDateLabel = "";
    let chartTitle = "";
    let chartLabels: string[] = [];
    let chartValues: number[] = [];

    if (statPeriod === 'week') {
        statRecords = records.filter(r => { const d = new Date(r.year, r.month, r.day); return d >= startOfWeek && d <= endOfWeek; });
        statDateLabel = `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;
        chartTitle = '每日杯数';
        chartLabels = weekStart === 'monday' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        chartValues = [0, 0, 0, 0, 0, 0, 0];
        statRecords.forEach(r => {
            const d = new Date(r.year, r.month, r.day);
            let dayIdx = d.getDay();
            if (weekStart === 'monday') { dayIdx = dayIdx === 0 ? 6 : dayIdx - 1; }
            chartValues[dayIdx]++;
        });
    } else if (statPeriod === 'month') {
        statRecords = currentMonthRecords;
        statDateLabel = `${currentYear}年${currentMonth + 1}月`;
        chartTitle = '每周杯数';
        chartLabels = ['第一周', '第二周', '第三周', '第四周', '第五周'];
        chartValues = [0, 0, 0, 0, 0];
        statRecords.forEach(r => { const weekIdx = Math.min(Math.floor((r.day - 1) / 7), 4); chartValues[weekIdx]++; });
    } else {
        statRecords = records.filter(r => r.year === currentYear);
        statDateLabel = `${currentYear}年`;
        chartTitle = '每月杯数';
        chartLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        chartValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        statRecords.forEach(r => { chartValues[r.month]++; });
    }

    const statCups = statRecords.length;
    const statCost = statRecords.reduce((sum, r) => sum + r.cost, 0);
    const maxChartVal = Math.max(...chartValues, 1);
    const unlabeledBrandName = prefLanguage === 'English' ? 'Unlabeled' : '未标记品牌';
    const otherBrandName = prefLanguage === 'English' ? 'Others' : '其他';

    const brandMetricMap = statRecords.reduce((acc, record) => {
        const name = record.brand?.trim() ? record.brand.trim() : unlabeledBrandName;
        if (!acc[name]) acc[name] = { cups: 0, cost: 0 };
        acc[name].cups += 1;
        acc[name].cost += Number(record.cost) || 0;
        return acc;
    }, {} as Record<string, { cups: number; cost: number }>);

    const brandMetricKey = brandDonutMode === 'cups' ? 'cups' : 'cost';
    const allBrandMetrics = Object.entries(brandMetricMap)
        .map(([brand, metric]) => ({ brand, cups: metric.cups, cost: metric.cost }))
        .sort((a, b) => { const delta = b[brandMetricKey] - a[brandMetricKey]; if (delta !== 0) return delta; return b.cups - a.cups; });

    const topBrandMetrics = allBrandMetrics.slice(0, 5);
    const otherBrandMetrics = allBrandMetrics.slice(5);
    const mergedBrandMetrics = otherBrandMetrics.length > 0
        ? [...topBrandMetrics, { brand: otherBrandName, cups: otherBrandMetrics.reduce((sum, item) => sum + item.cups, 0), cost: otherBrandMetrics.reduce((sum, item) => sum + item.cost, 0) }]
        : topBrandMetrics;

    const donutTotal = mergedBrandMetrics.reduce((sum, item) => sum + item[brandMetricKey], 0);
    const brandDonutItems = mergedBrandMetrics.map((item): BrandMetricItem => ({ ...item, ratio: donutTotal > 0 ? item[brandMetricKey] / donutTotal : 0 }));

    let donutProgress = 0;
    const donutGradient = brandDonutItems.map(item => {
        const start = donutProgress * 100; donutProgress += item.ratio; const end = donutProgress * 100;
        return `${getBrandColor(item.brand)} ${start}% ${end}%`;
    }).join(', ');

    const getMostFrequent = (arr: any[]) => {
        if (arr.length === 0) return prefLanguage === 'English' ? 'None' : '无';
        const counts = arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {} as Record<string, number>);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const receiptTopBrand = getMostFrequent(statRecords.map(r => r.brand).filter(b => b));
    const receiptTopTemp = getMostFrequent(statRecords.map(r => r.temperature).filter(t => t));
    const receiptTopSweet = getMostFrequent(statRecords.map(r => r.sweetness).filter(s => s));

    const currentCupLimit = statPeriod === 'week' ? (parseInt(weeklyCupLimit) || 0) : statPeriod === 'month' ? (parseInt(monthlyCupLimit) || 0) : 0;
    const currentBudget = statPeriod === 'week' ? (parseFloat(weeklyBudget) || 0) : statPeriod === 'month' ? (parseFloat(monthlyBudget) || 0) : 0;

    const renderDisciplineBar = (current: number, target: number, isMoney: boolean) => {
        if (target <= 0 || statPeriod === 'year') return null;
        const percent = (current / target) * 100;
        const isWarning = percent >= 80 && percent < 100;
        const isDanger = percent >= 100;
        const remaining = target - current;
        let statusText = "";
        if (isDanger) statusText = isMoney ? `超标 ￥${Math.abs(remaining).toFixed(1)} ` : `超标 ${Math.abs(remaining)} 杯 `;
        else if (isWarning) statusText = isMoney ? `仅剩 ￥${remaining.toFixed(1)} ` : `仅剩 ${remaining} 杯 `;
        else statusText = isMoney ? `剩余预算 ￥${remaining.toFixed(1)}` : `剩余额度 ${remaining} 杯`;
        const textColor = isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-text-muted';
        const barColor = isDanger ? '#EF4444' : isWarning ? '#F97316' : themeAccent;
        return (
            <div className="mt-3 w-full">
                <div className="h-1.5 w-full bg-bg-input rounded-full overflow-hidden mb-1.5"><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }} transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full" style={{ backgroundColor: barColor }} /></div>
                <div className={`text-[10px] font-bold ${textColor}`}>{statusText}</div>
            </div>
        );
    };

    return (
        <>
            {/* ================== UI ================== */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pb-32 pt-[calc(env(safe-area-inset-top)+32px)]">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold tracking-tight text-text-main">{prefLanguage === 'English' ? 'Stats' : '统计'}</h1>
                    <div className="flex items-center bg-bg-input/60 rounded-full py-1.5 px-1 shadow-sm border border-border-main/50 text-text-muted transition-colors">
                        <button onClick={handlePrevStatPeriod} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95"><ChevronLeft size={16} strokeWidth={2.5} /></button>
                        <div className="px-2 text-xs font-semibold tracking-wide min-w-[70px] text-center text-text-main whitespace-nowrap">{statDateLabel}</div>
                        <button onClick={handleNextStatPeriod} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95"><ChevronRight size={16} strokeWidth={2.5} /></button>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <button onClick={() => { setStatPeriod('week'); setStatAnimationKey(prev => prev + 1); }} className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'week' ? 'theme-bg shadow-md' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}>{prefLanguage === 'English' ? 'W' : '周'}</button>
                    <button onClick={() => { setStatPeriod('month'); setStatAnimationKey(prev => prev + 1); }} className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'month' ? 'theme-bg shadow-md' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}>{prefLanguage === 'English' ? 'M' : '月'}</button>
                    <button onClick={() => { setStatPeriod('year'); setStatAnimationKey(prev => prev + 1); }} className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'year' ? 'theme-bg shadow-md' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}>{prefLanguage === 'English' ? 'Y' : '年'}</button>
                    <div className="flex-1"></div>
                    {statCups > 0 && (
                        <button onClick={() => setShowStatsPoster(true)} className="px-3 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all">{prefLanguage === 'English' ? '✨ Wrapped' : '✨ 回忆'}</button>
                    )}
                    <button onClick={() => setShowStatsReceipt(true)} className="w-9 h-9 rounded-full bg-bg-card border border-border-main/50 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-input transition-colors"><Share size={16} /></button>
                </div>

                {/* 贴纸墙渲染 */}
                {(() => {
                    let stickerScale = 1;
                    const count = statRecords.length;
                    if (count > 80) stickerScale = 0.28;
                    else if (count > 40) stickerScale = 0.4;
                    else if (count > 20) stickerScale = 0.45;
                    else if (count > 10) stickerScale = 0.65;
                    else if (count > 5) stickerScale = 0.8;
                    const baseWidth = 64; const baseHeight = 80; const baseOverlap = -10;

                    return (
                        <div className="bg-bg-card rounded-[32px] h-64 w-full relative mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-border-main overflow-hidden flex items-end justify-center pb-2 px-4">
                            <div className="flex flex-wrap-reverse justify-center max-w-[95%]">
                                {statRecords.map((r, i) => {
                                    const isYearly = statPeriod === 'year' || count > 50;
                                    return (
                                        <motion.div
                                            key={`${r.id}-${statAnimationKey}`} 
                                            initial={{ y: isYearly ? 0 : -100, opacity: 0 }} 
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: isYearly ? Math.random() * 0.4 : i * Math.min(0.05, 0.95 / Math.max(count, 1)), type: isYearly ? 'tween' : 'spring', duration: isYearly ? 0.3 : undefined, bounce: isYearly ? 0 : 0.5 }}
                                            className="transform hover:!scale-125 hover:z-50 transition-all cursor-pointer relative will-change-transform"
                                            style={{ width: `${baseWidth * stickerScale}px`, height: `${baseHeight * stickerScale}px`, marginLeft: i === 0 ? '0px' : `${baseOverlap * stickerScale}px`, rotate: `${(i % 3 === 0 ? -1 : 1) * ((i % 10) * 2)}deg`, zIndex: i }}
                                            onClick={() => { triggerHaptic('medium'); setStatsSelectedRecord(r); }}
                                        >
                                            {isExportableImageSrc(r.imageUrl) ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={r.imageUrl} alt="drink" loading="lazy" decoding="async" className="w-full h-full object-contain" style={{ filter: "drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-text-muted" style={{ filter: "drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}><Coffee size={38 * stickerScale} strokeWidth={1.8} /></div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>
                            {statRecords.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">{prefLanguage === 'English' ? 'No tastings in this period yet' : '这段时间还没有品鉴'}</div>}
                        </div>
                    );
                })()}

                {/* GitHub 风格热力图 */}
                {statPeriod === 'year' && (() => {
                    const yearRecordsMap = new Map();
                    statRecords.forEach(r => yearRecordsMap.set(`${r.year}-${r.month}-${r.day}`, (yearRecordsMap.get(`${r.year}-${r.month}-${r.day}`) || 0) + 1));
                    const startDate = new Date(currentYear, 0, 1);
                    const endDate = new Date(currentYear, 11, 31);
                    const heatmapDays = [];
                    let startDayOfWeek = startDate.getDay();
                    if (weekStart === 'monday') startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
                    for (let i = 0; i < startDayOfWeek; i++) heatmapDays.push(null);
                    let maxStreak = 0; let currentStreak = 0;
                    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                        const count = yearRecordsMap.get(`${currentYear}-${d.getMonth()}-${d.getDate()}`) || 0;
                        heatmapDays.push({ month: d.getMonth(), day: d.getDate(), count, dateStr: `${currentYear}-${d.getMonth()}-${d.getDate()}` });
                        if (count > 0) { currentStreak++; if (currentStreak > maxStreak) maxStreak = currentStreak; } else currentStreak = 0;
                    }
                    const monthLabels: { month: number, col: number }[] = [];
                    let colIndex = 0;
                    heatmapDays.forEach((item, index) => { if (index % 7 === 0) colIndex++; if (item && item.day === 1) monthLabels.push({ month: item.month + 1, col: colIndex }); });

                    return (
                        <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-4 w-full">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="text-base text-text-main font-bold block">{currentYear} 年度热力图</span>
                                    <span className="text-[11px] text-text-muted font-medium">一眼看穿你的糖分摄入密度</span>
                                </div>
                                {maxStreak >= 5 && <div onClick={() => { triggerHaptic('medium'); showToast(`经检测，今年你曾连续 ${maxStreak} 天重度堕落，当时是发财了吗？`, 'info'); }} className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer hover:bg-orange-500/20 active:scale-95 transition-all"><Flame size={12} className="fill-orange-500" />高糖预警</div>}
                            </div>
                            <div className="w-full overflow-x-auto custom-scrollbar pb-3 pt-1 -mx-2 px-2">
                                <div className="flex text-[9px] text-text-muted font-bold mb-1.5 relative h-3" style={{ width: `${Math.ceil(heatmapDays.length / 7) * 14}px` }}>{monthLabels.map((lbl, i) => (<div key={i} className="absolute top-0 transform -translate-x-1" style={{ left: `${(lbl.col - 1) * 14}px` }}>{lbl.month}月</div>))}</div>
                                <div className="grid grid-rows-7 grid-flow-col gap-[4px] min-w-max">
                                    {heatmapDays.map((item, index) => {
                                        if (!item) return <div key={`empty-${index}`} className="w-[10px] h-[10px] rounded-[2px]"></div>;
                                        let bgColor = 'bg-bg-input/50'; let shadowClass = '';
                                        if (item.count === 1) bgColor = 'bg-amber-400';
                                        else if (item.count === 2) bgColor = 'bg-orange-500';
                                        else if (item.count >= 3) { bgColor = 'bg-red-500'; shadowClass = 'shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10 relative'; }
                                        return <div key={item.dateStr} onClick={() => { triggerHaptic('light'); showToast(item.count === 0 ? `${item.month + 1}月${item.day}日，胰岛很安全，0 杯` : `${item.month + 1}月${item.day}日，喝了 ${item.count} 杯，血液纯度已降至糖点。`, 'info'); }} className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer hover:ring-2 ring-border-main hover:scale-125 transition-all duration-200 ${bgColor} ${shadowClass}`}></div>;
                                    })}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] text-text-muted font-bold"><span>健康</span><div className="w-2.5 h-2.5 rounded-[2px] bg-bg-input/50"></div><div className="w-2.5 h-2.5 rounded-[2px] bg-amber-400"></div><div className="w-2.5 h-2.5 rounded-[2px] bg-orange-500"></div><div className="w-2.5 h-2.5 rounded-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div><span className="text-red-500">致“死”量</span></div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-bg-card rounded-[24px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-0">
                        <div className="min-w-0 w-full">
                            <span className="text-xs text-text-muted font-medium block mb-1.5">总杯数</span>
                            <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter truncate ${currentCupLimit > 0 && statCups >= currentCupLimit && statPeriod !== 'year' ? 'text-red-500' : ''}`} style={currentCupLimit > 0 && statCups >= currentCupLimit && statPeriod !== 'year' ? {} : { color: themeAccent }}>{statCups}</div>
                        </div>
                        {renderDisciplineBar(statCups, currentCupLimit, false)}
                    </div>
                    <div className="bg-bg-card rounded-[24px] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between min-w-0">
                        <div className="min-w-0 w-full">
                            <span className="text-xs text-text-muted font-medium block mb-1.5">总花费</span>
                            <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter truncate ${currentBudget > 0 && statCost >= currentBudget && statPeriod !== 'year' ? 'text-red-500' : ''}`} style={currentBudget > 0 && statCost >= currentBudget && statPeriod !== 'year' ? {} : { color: themeAccent }}>{parseFloat(statCost.toFixed(2))}</div>
                        </div>
                        {renderDisciplineBar(statCost, currentBudget, true)}
                    </div>

                    <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-base text-text-main font-bold">{prefLanguage === 'English' ? 'Brand Mix' : '品牌占比'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setBrandDonutMode('cups')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${brandDonutMode === 'cups' ? 'theme-bg shadow-sm' : 'bg-bg-input text-text-muted'}`}>{prefLanguage === 'English' ? 'Cups' : '杯数'}</button>
                                <button onClick={() => setBrandDonutMode('cost')} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${brandDonutMode === 'cost' ? 'theme-bg shadow-sm' : 'bg-bg-input text-text-muted'}`}>{prefLanguage === 'English' ? 'Cost' : '花费'}</button>
                            </div>
                        </div>
                        {brandDonutItems.length > 0 && donutTotal > 0 ? (
                            <div className="flex gap-4 items-center">
                                <div className="relative w-[124px] h-[124px] shrink-0">
                                    <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${donutGradient})` }} />
                                    <div className="absolute inset-[14px] rounded-full bg-bg-card flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-text-muted font-medium">{brandDonutMode === 'cups' ? (prefLanguage === 'English' ? 'Total Cups' : '总杯数') : (prefLanguage === 'English' ? 'Total Cost' : '总花费')}</span>
                                        <span className="text-lg font-black theme-text leading-tight">{brandDonutMode === 'cups' ? `${Math.round(donutTotal)}${prefLanguage === 'English' ? '' : '杯'}` : `￥${donutTotal.toFixed(1)}`}</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    {brandDonutItems.map(item => (
                                        <div key={item.brand} className="flex items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-2 min-w-0"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getBrandColor(item.brand) }} /><span className="text-text-main font-medium truncate">{item.brand}</span></div>
                                            <div className="text-text-muted font-medium shrink-0">{brandDonutMode === 'cups' ? `${item.cups}${prefLanguage === 'English' ? '' : '杯'}` : `￥${item.cost.toFixed(1)}`} · {(item.ratio * 100).toFixed(0)}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (<div className="h-[124px] rounded-2xl bg-bg-input/70 flex items-center justify-center text-sm text-text-muted">{prefLanguage === 'English' ? 'No tastings in this period yet' : '这段时间还没有品鉴'}</div>)}
                    </div>

                    <div className="bg-bg-card rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] col-span-2">
                        <span className="text-base text-text-main font-bold block mb-4">{chartTitle}</span>
                        <div className="flex justify-between items-end h-[100px] gap-1 sm:gap-2 mt-2">
                            {chartValues.map((val, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                                    <span className="text-text-muted text-xs font-bold min-h-[16px]">{val > 0 ? val : ''}</span>
                                    <motion.div initial={{ height: 0 }} animate={{ height: val > 0 ? `${Math.max((val / maxChartVal) * 100, 8)}%` : '4px' }} className={`w-full max-w-[36px] rounded-t-[6px] rounded-b-[2px] transition-all duration-500 ${val > 0 ? 'theme-gradient-v' : 'bg-transparent'}`} />
                                    <span className="text-[10px] text-text-muted font-medium whitespace-nowrap mt-1 flex-shrink-0">{chartLabels[idx]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ================== 月度/周期小票弹窗 ================== */}
            <AnimatePresence>
                {showStatsReceipt && (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} 
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        // 🚀 核心：加入拖拽返回引擎
                        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.8 }}
                        onDragEnd={(e, info) => { if (info.offset.x > 100 || info.velocity.x > 500) setShowStatsReceipt(false); }}
                        className="fixed inset-0 z-[100] bg-[#1a1a1e]/95 overflow-y-auto custom-scrollbar backdrop-blur-md"
                    >
                        <div className="min-h-full flex flex-col items-center justify-center py-12 px-4 w-full">
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} ref={receiptCardRef} className="bg-[#f8f8f8] w-full max-w-[340px] rounded-t-2xl relative flex flex-col pt-5 pb-3 px-5 text-gray-800 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                                <div className="flex justify-between items-start relative mb-3">
                                    <div className="font-extrabold text-[36px] tracking-tight leading-[0.95] text-[#102a4a]">{prefLanguage === 'English' ? 'Boba Bill' : '奶茶账单'}<br />Receipt</div>
                                    <div className="w-16 h-20 mr-1">
                                        {statRecords.length > 0 && isExportableImageSrc(statRecords[statRecords.length - 1].imageUrl) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={statRecords[statRecords.length - 1].imageUrl} className="w-full h-full object-contain filter drop-shadow-xl" alt="boba" />
                                        ) : (<Coffee size={56} className="text-[#102a4a] mt-1 ml-1 drop-shadow-xl" strokeWidth={1.8} />)}
                                    </div>
                                </div>
                                <div className="border-b-2 border-black/80 mb-4 w-full"></div>
                                <div className="mb-4">
                                    <h1 className="text-[40px] font-black tracking-[-0.04em] leading-none mb-1 text-[#102a4a]">{statPeriod === 'week' ? (prefLanguage === 'English' ? 'Weekly' : '本周统计') : statPeriod === 'month' ? (prefLanguage === 'English' ? 'Monthly' : '本月统计') : (prefLanguage === 'English' ? 'Yearly' : '年度统计')}</h1>
                                    <div className="text-[10px] text-gray-400 font-mono tracking-[0.24em] uppercase">No.BL{new Date().getTime().toString().slice(-10)}</div>
                                </div>
                                <div className="border-b border-dashed border-gray-300 mb-4 w-full"></div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px] font-medium text-gray-800 mb-4">
                                    <div><div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'PERIOD' : '统计周期'}</div><div className="font-bold text-[13px]">{statDateLabel}</div></div>
                                    <div><div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'TOTAL CUPS' : '杯数（总）'}</div><div className="font-bold text-[13px]">{statCups} {prefLanguage === 'English' ? 'Cups' : '杯'}</div></div>
                                    {statCups > 0 && (
                                        <>
                                            <div><div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'FAV BRAND' : '品牌（最爱）'}</div><div className="font-bold text-[13px] truncate pr-2">{receiptTopBrand}</div></div>
                                            <div><div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'PREF SPEC' : '规格（最常点）'}</div><div className="font-bold text-[13px] truncate">{receiptTopTemp} · {receiptTopSweet}</div></div>
                                        </>
                                    )}
                                    <div className="col-span-2 pt-2 mt-1 border-t border-dashed border-gray-200 flex justify-between items-end"><span className="text-gray-400 tracking-wider text-[11px] mb-1">{prefLanguage === 'English' ? 'TOTAL COST' : '消费金额'}</span><span className="font-black text-[32px] leading-none text-[#102a4a]">￥{parseFloat(statCost.toFixed(2))}</span></div>
                                </div>
                                {statCups > 0 && (
                                    <div className="mb-3 border-y border-dashed border-gray-300 py-2">
                                        <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-1.5 tracking-widest"><span>{prefLanguage === 'English' ? 'BRAND / QTY' : '品牌 / 数量'}</span><span>{prefLanguage === 'English' ? 'AMOUNT' : '金额'}</span></div>
                                        <div className="space-y-1.5">{mergedBrandMetrics.map((item, i) => (<div key={i} className="flex justify-between items-center text-[11px] font-medium text-gray-800"><div className="flex items-center gap-1.5"><span className="font-bold text-[12px] text-[#102a4a]">{item.brand}</span><span className="text-[9px] text-gray-500 font-mono">x{item.cups}</span></div><div className="font-black text-[13px] text-[#102a4a]">￥{item.cost.toFixed(1)}</div></div>))}</div>
                                        <div className="pt-1.5 mt-1.5 border-t border-dotted border-gray-200"><div className="flex justify-between text-[9px] text-gray-400 font-medium"><span>{prefLanguage === 'English' ? 'Happiness Tax (100%)' : '多巴胺附加税 (100%)'}</span><span className="italic">Included / 已免除</span></div></div>
                                    </div>
                                )}
                                <div className="mt-2 mb-2 flex flex-col items-center justify-center">
                                    <div className="text-[9px] text-gray-400 font-bold tracking-widest mb-1.5">{prefLanguage === 'English' ? 'CURRENT STATUS' : '- 本期饮茶成就 -'}</div>
                                    <div className="border-[2px] border-[#102a4a] text-[#102a4a] px-3 py-0.5 font-black text-[11px] tracking-widest uppercase transform -rotate-2 bg-[#f8f8f8] shadow-sm">{getReceiptTitle(statCups, statPeriod, prefLanguage)}</div>
                                </div>
                                <div className="text-center text-[9px] text-gray-300 font-mono mb-2 uppercase tracking-[0.22em]">{prefLanguage === 'English' ? 'Sugar Time' : 'Sugar Time'}</div>
                                <div className="border-b border-dashed border-gray-300 mb-2 w-full"></div>
                                <div className="flex justify-center h-8 opacity-80 mb-1">{Array.from({ length: 40 }).map((_, i) => (<div key={i} className={`h-full bg-black mx-[0.5px] ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-[2px]'}`}></div>))}</div>
                                <div className="absolute -bottom-[6px] left-0 right-0 h-3 flex justify-around px-1 overflow-hidden pointer-events-none">{Array.from({ length: 30 }).map((_, i) => (<div key={`dot-${i}`} className="w-[8px] h-[8px] rounded-full bg-[#1a1a1e]"></div>))}</div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 mt-8 w-full max-w-[360px]">
                                <button onClick={() => handleSaveReceipt(receiptCardRef)} className="flex-1 py-3.5 rounded-full border border-white/80 text-white font-bold bg-transparent tracking-widest text-sm hover:bg-white/10 transition-colors shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">{prefLanguage === 'English' ? 'SAVE' : '保存小票'}</button>
                                <button onClick={() => handleShareReceipt(receiptCardRef)} className="flex-1 py-3.5 rounded-full bg-white text-black font-bold tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-[0_10px_24px_rgba(255,255,255,0.25)]">{prefLanguage === 'English' ? 'SHARE' : '分享'}</button>
                            </motion.div>
                            <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onClick={() => setShowStatsReceipt(false)} className="mt-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl pb-1 shadow-lg hover:bg-gray-100 transition-colors shrink-0"><X size={22} strokeWidth={2.5} /></motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================== Spotify 年度/月度总结海报 ================== */}
            <AnimatePresence>
                {showStatsPoster && (
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} 
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        // 🚀 核心：加入拖拽返回引擎
                        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.8 }}
                        onDragEnd={(e, info) => { if (info.offset.x > 100 || info.velocity.x > 500) setShowStatsPoster(false); }}
                        className="fixed inset-0 z-[100] bg-black/80 overflow-y-auto custom-scrollbar backdrop-blur-xl"
                    >
                        <div className="min-h-full flex flex-col items-center justify-center py-12 px-4 w-full">
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} ref={posterRef} className="w-full max-w-[360px] rounded-3xl relative flex flex-col p-8 text-white shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden" style={{ background: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #4c1d95 100%)' }}>
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div className="text-xs font-bold tracking-[0.3em] uppercase text-white/60">Sugar Ultra</div>
                                    <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md text-xs font-bold border border-white/10">{statDateLabel}</div>
                                </div>
                                <div className="relative z-10 mb-8">
                                    <h1 className="text-[28px] font-black tracking-tight leading-tight mb-2">{prefLanguage === 'English' ? 'Your Boba Wrapped' : '你的饮茶回忆录'}</h1>
                                    <div className="flex items-baseline gap-2"><span className="text-[72px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">{statCups}</span><span className="text-xl font-bold text-white/80">{prefLanguage === 'English' ? 'Cups' : '杯'}</span></div>
                                </div>
                                <div className="space-y-3.5 relative z-10 flex-1 flex flex-col justify-center mb-2">
                                    {(() => {
                                        let intro = prefLanguage === 'English' ? `You've consumed ${statCups} cups during this period.` : `在这个周期里，你共消耗了 ${statCups} 杯快乐水。`;
                                        if (statCups > 20) intro = prefLanguage === 'English' ? `Swimming in boba! You enjoyed a massive ${statCups} cups.` : `你简直是泡在奶茶里！共消耗了惊人的 ${statCups} 杯生命之水。`;
                                        else if (statCups <= 5 && statCups > 0) intro = prefLanguage === 'English' ? `Amazing self-control! Only ${statCups} cups consumed.` : `你展现了惊人的克制力，仅用 ${statCups} 杯就安稳度过。`;
                                        let brandStr = "";
                                        if (receiptTopBrand !== '无' && receiptTopBrand !== 'None' && statCups > 0) brandStr = prefLanguage === 'English' ? `Your most loyal companion was 「${receiptTopBrand}」.` : `你最长情的陪伴是「${receiptTopBrand}」，它是你最稳定的多巴胺来源。`;
                                        else if (statCups > 0) brandStr = prefLanguage === 'English' ? `You love exploring all kinds of brands.` : `你是个博爱的人，雨露均沾，没有偏爱任何一家。`;
                                        let specStr = "";
                                        if (statCups > 0) specStr = prefLanguage === 'English' ? `You're a firm believer in 「${receiptTopTemp} + ${receiptTopSweet}」.` : `你是个坚定的「${receiptTopTemp} · ${receiptTopSweet}」党，这是你不妥协的口味底线。`;
                                        return (
                                            <>
                                                <p className="text-[13.5px] font-medium leading-relaxed text-white/90">{intro}</p>
                                                {brandStr && <p className="text-[13.5px] font-medium leading-relaxed text-white/90">{brandStr}</p>}
                                                {specStr && <p className="text-[13.5px] font-medium leading-relaxed text-white/90">{specStr}</p>}
                                                <p className="text-[13.5px] font-medium leading-relaxed text-white/90">{prefLanguage === 'English' ? `Total investment in happiness: ￥${statCost.toFixed(1)}.` : `你累计向饮茶事业投资了 ￥${statCost.toFixed(1)}，实力有目共睹。`}</p>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-end relative z-10">
                                    <div className="text-[10px] text-white/40 font-mono">GENERATED BY<br />SUGAR ULTRA</div>
                                    <div className="border-[3px] border-pink-400 text-pink-300 px-4 py-2 font-black text-[16px] tracking-widest uppercase transform rotate-6 bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(244,114,182,0.3)]">{getReceiptTitle(statCups, statPeriod, prefLanguage)}</div>
                                </div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 mt-8 w-full max-w-[360px]">
                                <button onClick={() => handleSaveReceipt(posterRef)} className="flex-1 py-3.5 rounded-full border border-white/30 text-white font-bold bg-white/10 backdrop-blur-md tracking-widest text-sm hover:bg-white/20 transition-colors">{prefLanguage === 'English' ? 'SAVE' : '保存海报'}</button>
                                <button onClick={() => handleShareReceipt(posterRef)} className="flex-1 py-3.5 rounded-full bg-white text-black font-bold tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-lg">{prefLanguage === 'English' ? 'SHARE' : '分享海报'}</button>
                            </motion.div>
                            <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onClick={() => setShowStatsPoster(false)} className="mt-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold text-xl pb-1 hover:bg-white/20 transition-colors border border-white/20 shrink-0"><X size={22} strokeWidth={2.5} /></motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ================== 纯展示回忆卡片 (极简版详情) ================== */}
            <AnimatePresence>
                {statsSelectedRecord && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} 
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        // 🚀 核心：加入拖拽返回引擎
                        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.8 }}
                        onDragEnd={(e, info) => { if (info.offset.x > 100 || info.velocity.x > 500) setStatsSelectedRecord(null); }}
                        onClick={() => setStatsSelectedRecord(null)}
                        className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[300px] bg-bg-card rounded-[28px] p-6 relative shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col items-center border border-border-main/50"
                        >
                            <button onClick={() => setStatsSelectedRecord(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors z-10">
                                <X size={18} strokeWidth={2.5} />
                            </button>
                            <div className="text-[10px] font-bold tracking-widest text-text-muted mb-4 theme-bg/10 px-3 py-1 rounded-full uppercase">
                                {statsSelectedRecord.year} / {String(statsSelectedRecord.month + 1).padStart(2, '0')} / {String(statsSelectedRecord.day).padStart(2, '0')}
                            </div>
                            <div className="w-28 h-36 flex items-center justify-center mb-5 relative">
                                {isExportableImageSrc(statsSelectedRecord.imageUrl) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={statsSelectedRecord.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-xl scale-110" />
                                ) : (
                                    <div className="w-full h-full bg-bg-input/50 rounded-2xl flex items-center justify-center -rotate-2">
                                        <Coffee size={56} className="text-text-muted opacity-50" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                            <div className="text-center w-full">
                                {statsSelectedRecord.brand && (
                                    <div className="text-[11px] font-bold theme-text mb-1.5">{statsSelectedRecord.brand}</div>
                                )}
                                <h3 className="text-xl font-black text-text-main mb-3 leading-tight px-2 break-words">
                                    {statsSelectedRecord.type}
                                </h3>
                                <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                                    {[statsSelectedRecord.size, statsSelectedRecord.temperature, statsSelectedRecord.sweetness].filter(Boolean).map((tag, idx) => (
                                        <span key={idx} className="text-[11px] bg-bg-input text-text-muted px-2.5 py-1 rounded-md font-medium">{tag}</span>
                                    ))}
                                </div>
                                <div className="border-t border-dashed border-border-main/60 pt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-sm font-bold theme-text">￥</span>
                                    <span className="text-3xl font-black theme-text leading-none">{statsSelectedRecord.cost}</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}