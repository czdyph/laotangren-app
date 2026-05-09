"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Plus, Edit2, Share, Trash2, ChevronLeft, ChevronRight, Search, Trophy, Flame } from "lucide-react";
import confetti from 'canvas-confetti';
import { DrinkRecord } from "@/types";
import { getBrandKey, getBrandLogoFile, isExportableImageSrc, calculateDisciplineStats } from '@/utils/helpers';
import SwipeableItem from './SwipeableItem';

interface HomeTabProps {
    records: DrinkRecord[];
    currentDate: Date | null;
    setCurrentDate: (date: Date) => void;
    selectedDay: number | null;
    setSelectedDay: (day: number | null) => void;
    weekStart: string;
    cardDensity: string;
    calendarImageMode: string;
    themeAccent: string;
    setShowHistoryModal: (show: boolean) => void;
    openAddModal: () => void;
    openEditModal: (record: DrinkRecord) => void;
    handleDeleteDrink: (record: DrinkRecord) => void;
    handleShare: (record: DrinkRecord) => void;
    triggerHaptic: (style?: any) => void;
    showToast: (msg: string, type?: string) => void;
    isLoaded: boolean;
}

export default function HomeTab({
    records, currentDate, setCurrentDate, selectedDay, setSelectedDay,
    weekStart, cardDensity, calendarImageMode, themeAccent,
    setShowHistoryModal, openAddModal, openEditModal, handleDeleteDrink, handleShare,
    triggerHaptic, showToast, isLoaded
}: HomeTabProps) {

    // 🌟 属于首页私有的 UI 状态
    const [monthDirection, setMonthDirection] = useState(0);
    const [calendarLogoTick, setCalendarLogoTick] = useState(0);
    const [pendingDelete, setPendingDelete] = useState<string | null>(null);
    const deleteTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [showStreakAnim, setShowStreakAnim] = useState(false);
    const [lastStreak, setLastStreak] = useState(-1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 🌟 软删除 (后悔药) 引擎
    const executeSoftDelete = (record: DrinkRecord) => {
        setPendingDelete(record.id);
        setDeleteCountdown(5); // 每次触发软删除，重置倒计时为 5
        triggerHaptic('heavy');

        // 清理上一次可能残留的定时器
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        // 🚀 视觉引擎：每 1000 毫秒让数字减 1
        countdownIntervalRef.current = setInterval(() => {
            setDeleteCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // 🚀 物理引擎：严格锁定 5000 毫秒后执行斩立决
        deleteTimerRef.current = setTimeout(() => {
            handleDeleteDrink(record);
            setPendingDelete(null);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }, 5000);
    };

    const undoDelete = () => {
        // 撤销时，立刻刹停两个引擎
        if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        setPendingDelete(null);
        triggerHaptic('success');
        showToast('已撤销删除', 'success');
    };

    // 日历 Logo 轮播引擎
    useEffect(() => {
        const timer = setInterval(() => setCalendarLogoTick(prev => prev + 1), 1800);
        return () => clearInterval(timer);
    }, []);

    const disciplineStats = calculateDisciplineStats(records);

    // 连续打卡动效监控
    useEffect(() => {
        if (!isLoaded || !disciplineStats || lastStreak === -1) {
            if (disciplineStats && lastStreak === -1) setLastStreak(disciplineStats.streak);
            return;
        }
        if (disciplineStats.streak > lastStreak) {
            const newStreak = disciplineStats.streak;
            setShowStreakAnim(true);
            setTimeout(() => setShowStreakAnim(false), 3000);
            if ([3, 7, 14, 21, 30, 50, 100].includes(newStreak)) {
                triggerHaptic('success');
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#F97316', '#FCD34D', '#ffffff', '#8E7558', '#D2B48C'], zIndex: 9999 });
            } else {
                triggerHaptic('medium');
            }
        }
        setLastStreak(disciplineStats.streak);
    }, [disciplineStats?.streak, isLoaded]);

    const handlePrevMonth = () => {
        if (!currentDate) return;
        setMonthDirection(-1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        if (!currentDate) return;
        setMonthDirection(1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDay(null);
    };

    if (!currentDate) return null;

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    const currentDayOfWeek = currentDate.getDay();

    const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    let firstDayOfWeek = getFirstDayOfMonth(currentMonth, currentYear);
    let weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    if (weekStart === 'monday') {
        weekDays = ['一', '二', '三', '四', '五', '六', '日'];
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    }

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
    const weekDaysFull = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    const currentMonthRecords = records.filter(r => r.month === currentMonth && r.year === currentYear);
    const sortedMonthRecords = [...currentMonthRecords].sort((a, b) => {
        if (b.day !== a.day) return b.day - a.day;
        const aTime = Number.parseInt(a.id, 10);
        const bTime = Number.parseInt(b.id, 10);
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

    const nextMilestone = disciplineStats ? (disciplineStats.streak < 3 ? 3 : disciplineStats.streak < 7 ? 7 : disciplineStats.streak < 14 ? 14 : disciplineStats.streak < 21 ? 21 : Math.ceil((disciplineStats.streak + 1) / 7) * 7) : 3;
    const streakProgress = disciplineStats ? (disciplineStats.streak / nextMilestone) * 100 : 0;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full w-full">
            {/* Header 与日历区 */}
            <div className="flex-none bg-bg-app px-5 pb-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-b border-border-main/40 z-20 relative pt-[calc(env(safe-area-inset-top)+20px)]">
                <div className="mb-4 relative w-full">
                    <div className="absolute right-0 top-0 flex items-center gap-2 sm:gap-3 z-20">
                        <button onClick={() => setShowHistoryModal(true)} className="w-8 h-8 rounded-full bg-bg-card border border-border-main/50 flex items-center justify-center text-text-muted hover:text-text-main transition-colors shadow-sm active:scale-95">
                            <Search size={15} strokeWidth={2.5} />
                        </button>
                        <div className="flex items-center bg-bg-input/40 rounded-full py-1.5 px-1 shadow-sm border border-border-main/50 text-text-muted hover:bg-bg-input/80 transition-colors">
                            <button onClick={handlePrevMonth} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95"><ChevronLeft size={16} strokeWidth={2.5} /></button>
                            <div className="px-1 text-xs font-semibold tracking-wide min-w-[68px] text-center text-text-main whitespace-nowrap">{currentYear}年{currentMonth + 1}月</div>
                            <button onClick={handleNextMonth} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95"><ChevronRight size={16} strokeWidth={2.5} /></button>
                        </div>
                    </div>

                    <div className="w-full">
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div key={`${currentYear}-${currentMonth}`} initial={{ x: monthDirection * 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -monthDirection * 20, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex flex-col w-full">
                                <h1 className="text-[2.2rem] font-black mb-0 tracking-tight text-text-main leading-none w-1/2">{currentMonth + 1}月</h1>
                                <div className="flex justify-between items-center w-full mt-3 gap-2">
                                    <p className="text-text-muted text-[13px] font-medium tracking-wide truncate flex-1 min-w-0">
                                        {currentMonth + 1}月{currentDay}日 {weekDaysFull[currentDayOfWeek]}
                                    </p>
                                    {disciplineStats && (
                                        <motion.div layout onClick={() => { showToast(disciplineStats.comment, 'info'); setShowStreakAnim(true); setTimeout(() => setShowStreakAnim(false), 2000); }} className="relative flex items-center gap-1 px-2.5 py-1 rounded-full bg-bg-input/60 backdrop-blur-md border border-border-main/40 text-[10px] font-bold cursor-pointer active:scale-95 shadow-sm overflow-hidden shrink-0">
                                            {disciplineStats.type === 'streak' && <motion.div initial={{ width: 0 }} animate={{ width: `${streakProgress}%` }} transition={{ type: "spring", damping: 20, delay: 0.2 }} className="absolute left-0 top-0 bottom-0 bg-orange-500/15 z-0" />}
                                            {disciplineStats.type === 'streak' ? (
                                                <>
                                                    <motion.div animate={showStreakAnim ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}} transition={{ duration: 0.5 }} className="relative z-10"><Flame size={12} className="text-orange-500 fill-orange-500 shrink-0" /></motion.div>
                                                    <span className="text-orange-600 relative z-10 flex items-center">连续打卡<div className="relative h-[14px] w-[15px] mx-0.5 overflow-hidden flex justify-center items-center"><AnimatePresence mode="popLayout"><motion.span key={disciplineStats.streak} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }} transition={{ type: "spring", bounce: 0.5 }} className="absolute leading-none">{disciplineStats.streak}</motion.span></AnimatePresence></div>天</span>
                                                    <AnimatePresence>{showStreakAnim && <motion.span initial={{ width: 0, opacity: 0, marginLeft: 0 }} animate={{ width: 'auto', opacity: 1, marginLeft: 6 }} exit={{ width: 0, opacity: 0, marginLeft: 0 }} className="text-[9px] text-orange-500/90 relative z-10 whitespace-nowrap overflow-hidden border-l border-orange-500/20 pl-1.5">还差 {nextMilestone - disciplineStats.streak} 天升级</motion.span>}</AnimatePresence>
                                                </>
                                            ) : (
                                                <>
                                                    <Trophy size={11} className="text-green-500 shrink-0 relative z-10" />
                                                    <span className="text-green-600 relative z-10">连续戒糖 {disciplineStats.sober} 天</span>
                                                    <span className="text-text-muted opacity-40 ml-0.5 relative z-10">| 吐槽</span>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="bg-bg-card rounded-[28px] p-4 px-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] mb-4 overflow-hidden border border-border-main/30">
                    <div className="grid grid-cols-7 gap-x-2 mb-2">
                        {weekDays.map(d => (<div key={d} className="text-center text-[11px] text-text-muted font-bold">{d}</div>))}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div key={`${currentYear}-${currentMonth}`} initial={{ x: monthDirection * 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -monthDirection * 30, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="grid grid-cols-7 gap-y-2 gap-x-2">
                            {blanks.map(b => (<div key={`blank-${b}`} className="aspect-square"></div>))}
                            {days.map(day => {
                                const teaRecordsForDay = currentMonthRecords.filter(r => r.day === day);
                                const firstRecord = teaRecordsForDay[0];
                                const isSelected = selectedDay === day;
                                const brandCounts = teaRecordsForDay.reduce((acc, record) => { const key = getBrandKey(record.brand || ""); if (!key) return acc; acc[key] = (acc[key] || 0) + 1; return acc; }, {} as Record<string, number>);
                                const sortedBrandKeys = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).map(([key]) => key);
                                const brandLogos = sortedBrandKeys.map(key => getBrandLogoFile(key)).filter((logo): logo is string => Boolean(logo));
                                const activeLogoIndex = brandLogos.length > 1 ? calendarLogoTick % brandLogos.length : 0;
                                const activeLogo = brandLogos.length > 0 ? brandLogos[activeLogoIndex] : null;
                                const activeLogoAlt = sortedBrandKeys.length > 0 ? sortedBrandKeys[activeLogoIndex] : "brand";
                                const rotatedRecordIndex = teaRecordsForDay.length > 1 ? calendarLogoTick % teaRecordsForDay.length : 0;
                                const rotatedRecord = teaRecordsForDay.length > 0 ? teaRecordsForDay[rotatedRecordIndex] : firstRecord;
                                const uploadedImageSource = rotatedRecord?.imageUrl || firstRecord?.imageUrl || "";
                                const uploadedImage = isExportableImageSrc(uploadedImageSource) ? uploadedImageSource : "";
                                const shouldShowBrandLogo = calendarImageMode === 'brand' && Boolean(activeLogo);
                                const calendarImageSrc = shouldShowBrandLogo ? `/logos/${activeLogo}` : uploadedImage.length > 4 ? uploadedImage : null;
                                const calendarImageAlt = shouldShowBrandLogo ? activeLogoAlt : "drink";
                                const shouldAnimateCalendarImage = shouldShowBrandLogo ? brandLogos.length > 1 : teaRecordsForDay.length > 1;
                                const calendarImageKey = shouldAnimateCalendarImage ? `${day}-${calendarImageSrc}-${calendarLogoTick}` : `${day}-${calendarImageSrc}`;

                                return (
                                    <button
                                        key={`day-${day}`}
                                        onClick={(e) => {
                                            e.preventDefault(); setSelectedDay(day);
                                            setTimeout(() => {
                                                const container = scrollContainerRef.current;
                                                const target = document.getElementById(`record-date-${day}`);
                                                if (container && target) { container.scrollTo({ top: target.offsetTop - 15, behavior: 'smooth' }); triggerHaptic('medium'); }
                                                else triggerHaptic('light');
                                            }, 100);
                                        }}
                                        className={`aspect-square flex items-center justify-center rounded-[14px] text-sm font-medium relative overflow-hidden transition-colors cursor-pointer ${isSelected ? 'theme-bg text-white shadow-md ring-2 theme-ring' : (!firstRecord ? 'bg-bg-input text-text-main hover:bg-border-main' : 'bg-border-main')}`}
                                    >
                                        {firstRecord ? (
                                            <div className="absolute inset-0 flex items-center justify-center p-1">
                                                {calendarImageSrc ? (
                                                    <AnimatePresence mode="wait" initial={false}>
                                                        <motion.div key={calendarImageKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="w-full h-full">
                                                            <img src={calendarImageSrc} alt={calendarImageAlt} className="w-full h-full object-contain filter drop-shadow-sm scale-110" />
                                                        </motion.div>
                                                    </AnimatePresence>
                                                ) : (<Coffee size={26} className="text-text-muted" strokeWidth={1.8} />)}
                                            </div>
                                        ) : (<span className="relative z-10">{day}</span>)}
                                        {firstRecord && isSelected && (<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-bg-app"></div>)}
                                    </button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <button onClick={openAddModal} className="w-full theme-gradient text-white h-[52px] rounded-full text-[16px] font-bold theme-shadow flex justify-center items-center gap-2 active:scale-95 transition-transform">
                    <Plus size={20} strokeWidth={3} />添加一杯
                </button>
            </div>

            {/* 列表区 */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-36 custom-scrollbar relative">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                    <span>{`${currentMonth + 1}月奶茶`}</span>
                    <span className="text-sm font-medium text-text-muted">{sortedMonthRecords.length} 杯</span>
                </h2>
                <div className={cardDensity === "compact" ? "space-y-2.5" : "space-y-4"}>
                    {sortedMonthRecords.length === 0 ? (
                        <div className="bg-bg-card rounded-[24px] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                            <p className="text-text-muted text-sm font-medium">本月还没有喝奶茶</p>
                        </div>
                    ) : (
                        sortedMonthRecords.map((record, index) => {
                            const recordDateString = `${record.month + 1}月${record.day}日`;
                            const showDateHeader = index === 0 || sortedMonthRecords[index - 1].day !== record.day;
                            return (
                                <div key={record.id} className={`space-y-2 ${showDateHeader ? 'mt-2' : '-mt-1'}`}>
                                    {showDateHeader && <div id={`record-date-${record.day}`} className="text-lg font-black tracking-tight text-text-main ml-1 mt-4 mb-2">{recordDateString}</div>}

                                    <AnimatePresence>
                                        {pendingDelete !== record.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                            >
                                                <SwipeableItem
                                                    onEdit={() => openEditModal(record)}
                                                    onShare={() => handleShare(record)}
                                                    onDelete={() => executeSoftDelete(record)}
                                                    triggerHaptic={triggerHaptic}
                                                >
                                                    <div className={`bg-bg-card flex items-center relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${cardDensity === "compact" ? "p-3 gap-3" : "p-4 gap-4"}`}>
                                                        <div className="w-14 h-16 flex-shrink-0 flex items-center justify-center">
                                                            {isExportableImageSrc(record.imageUrl) ? (<img src={record.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-sm scale-110" />) : (<Coffee size={44} className="text-text-muted" strokeWidth={1.8} />)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-col mb-1">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    {record.brand && <span className="text-[11px] bg-border-main px-2 py-0.5 rounded-full text-text-muted font-bold">{record.brand}</span>}
                                                                    {record.temperature && record.temperature.includes('冰') ? (<span className="text-[14px] leading-none drop-shadow-sm">🧊</span>) : record.temperature === '热' ? (<span className="text-[14px] leading-none drop-shadow-sm text-red-500">♨️</span>) : null}
                                                                </div>
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <span className="font-bold text-text-main text-base leading-snug flex-1 min-w-0 break-all line-clamp-2">{record.type}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-text-muted font-medium flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span className="shrink-0">{record.size || '中杯'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end justify-center h-full gap-1 shrink-0">
                                                            <span className="font-bold theme-text text-lg whitespace-nowrap">￥{record.cost}</span>
                                                            <span className="flex items-center gap-1 text-[10px] bg-bg-input px-2 py-0.5 rounded text-text-muted font-medium whitespace-nowrap"><span>{record.sweetness || '标准糖'}</span><span>/</span><span>{record.temperature || '正常冰'}</span></span>
                                                        </div>
                                                    </div>
                                                </SwipeableItem>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 💊 浮动的后悔药条 (Apple 级悬浮胶囊) */}
            <AnimatePresence>
                {pendingDelete && (
                    <motion.div
                        initial={{ y: 60, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 22, stiffness: 300 }}
                        // 🚀 核心优化：全部换成 bg-bg-card 和 border-border-main 这类自动适应浅/深色模式的语义类名
                        className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-bg-card/90 backdrop-blur-xl border border-border-main/50 px-5 py-3 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.15)] flex items-center gap-3.5 z-[200] whitespace-nowrap min-w-max"
                    >
                        <div className="flex items-center gap-2 text-text-main">
                            <Trash2 size={15} strokeWidth={2.5} className="opacity-70" />
                            <span className="text-[13px] font-bold tracking-wide opacity-90">已删除 1 条记录</span>
                        </div>
                        <div className="w-[1px] h-3.5 bg-border-main"></div>
                        <button
                            onClick={undoDelete}
                            className="text-[13px] font-black theme-text active:scale-95 transition-transform flex items-center gap-1 hover:opacity-80"
                        >
                            {/* 🚀 将静态的 5s 替换为动态跳动的心跳数字 */}
                            撤销 <span className="text-[10px] font-medium opacity-70">{deleteCountdown}s</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}