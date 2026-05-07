"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, BarChart3, Settings as SettingsIcon, Plus, Edit2, Share, Trash2, ChevronLeft, ChevronRight, MessageSquare, Info, Flame, X, Search, Trophy } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';
import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useExportActions } from '@/hooks/useExportActions';
import { saveImageToDisk, initImageDirectory, deleteImageFromDisk } from '@/utils/fileManager';
import { App as CapApp } from '@capacitor/app';

// 👇 引入我们的新架构
import { useStore } from '@/store/useStore';
import { useImmersiveStatusBar } from '@/hooks/useImmersiveStatusBar';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useAutoTheme } from '@/hooks/useAutoTheme';

import { DrinkRecord } from "@/types";
import { getBrandKey, getBrandLogoFile, isExportableImageSrc, compressBase64Image, waitForReceiptAssets, getAchievementsData, calculateDisciplineStats } from '@/utils/helpers';
import AddDrinkFormModal from '@/components/AddDrinkFormModal';
import SettingsTab from "@/components/SettingsTab";
import StatsTab from "@/components/StatsTab";
import HistoryModal from '@/components/HistoryModal';
import SingleReceiptModal from '@/components/SingleReceiptModal';

export default function App() {
  // 🌟 1. 一键接管全局数据！(替代了之前的 20 个 useState)
  const store = useStore();
  const {
    records, isLoaded, themeMode, prefLanguage, defaultTemp, defaultSweet,
    themeAccent, fontScale, cardDensity, weekStart,
    weeklyBudget, weeklyCupLimit, monthlyBudget, monthlyCupLimit,
    calendarImageMode
  } = store;

  // 🌟 2. 编写适配器：完美解决 SettingsTab 的 ts(2741) 缺少属性报错
  const setRecords = store.setRecords;
  const setThemeMode = store.setThemeMode;
  const setPrefLanguage = (val: string) => store.updateSetting('prefLanguage', val);
  const setDefaultTemp = (val: string) => store.updateSetting('defaultTemp', val);
  const setDefaultSweet = (val: string) => store.updateSetting('defaultSweet', val);
  const setThemeAccent = (val: string) => store.updateSetting('themeAccent', val);
  const setFontScale = (val: any) => store.updateSetting('fontScale', val);
  const setCardDensity = (val: any) => store.updateSetting('cardDensity', val);
  const setWeekStart = (val: any) => store.updateSetting('weekStart', val);
  const setCalendarImageMode = (val: any) => store.updateSetting('calendarImageMode', val);
  const setWeeklyBudget = (val: string) => store.updateSetting('weeklyBudget', val);
  const setWeeklyCupLimit = (val: string) => store.updateSetting('weeklyCupLimit', val);
  const setMonthlyBudget = (val: string) => store.updateSetting('monthlyBudget', val);
  const setMonthlyCupLimit = (val: string) => store.updateSetting('monthlyCupLimit', val);

  // 🌟 3. UI 交互状态 (页面显隐、路由等仍留在本组件)
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DrinkRecord | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [selectedAchv, setSelectedAchv] = useState<any>(null);
  const [shareRecord, setShareRecord] = useState<DrinkRecord | null>(null);
  const singleReceiptRef = useRef<HTMLDivElement>(null);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [monthDirection, setMonthDirection] = useState(0);
  const [calendarLogoTick, setCalendarLogoTick] = useState(0);
  const [showStatsReceipt, setShowStatsReceipt] = useState(false);
  const [showStatsPoster, setShowStatsPoster] = useState(false);
  const [statsSelectedRecord, setStatsSelectedRecord] = useState<DrinkRecord | null>(null);

  const [toastMsg, setToastMsg] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [achievementBanner, setAchievementBanner] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.initialize();
    initImageDirectory(); // 👈 启动时建好文件夹
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  }, []);

// 🚀 Android 专属：系统级返回键拦截（全能加固版）
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupBackButtonListener = async () => {
      return await CapApp.addListener('backButton', () => {
        // 1. 按照视觉优先级，优先关闭所有可能的浮层/弹窗
        if (toastMsg) setToastMsg(null);
        else if (achievementBanner) setAchievementBanner(null);
        else if (selectedAchv) setSelectedAchv(null);
        else if (shareRecord) setShareRecord(null);
        // 👇 核心修复：让主页面能关掉统计页的 3 个弹窗
        else if (statsSelectedRecord) setStatsSelectedRecord(null);
        else if (showStatsPoster) setShowStatsPoster(false);
        else if (showStatsReceipt) setShowStatsReceipt(false);
        // 👆 ------------------------------------------
        else if (showAboutUsModal) setShowAboutUsModal(false);
        else if (showAchievementsModal) setShowAchievementsModal(false);
        else if (showHistoryModal) setShowHistoryModal(false);
        else if (showAddModal) setShowAddModal(false);
        else {
          CapApp.minimizeApp();
        }
      });
    };

    const listenerPromise = setupBackButtonListener();

    return () => {
      listenerPromise.then(listener => {
        if (listener) listener.remove();
      });
    };
  }, [
    toastMsg, achievementBanner, selectedAchv, shareRecord, 
    showAboutUsModal, showAchievementsModal, showHistoryModal, 
    showAddModal, activeTab,
    // 🌟 必须把这三个新状态加入依赖数组，否则拦截器拿不到最新状态
    showStatsReceipt, showStatsPoster, statsSelectedRecord 
  ]);


  // 🚀 核心架构 Hook 调用
  const isDark = useAutoTheme(themeMode, isLoaded); // 不再报错 isLoaded undefined
  useImmersiveStatusBar(isDark, isLoaded);
  useWidgetSync(records, weeklyBudget, weekStart, calendarImageMode, isLoaded);

  // 全局字号驱动
  useEffect(() => {
    if (!isLoaded) return;
    const scaleMap: any = { small: '14.5px', medium: '16px', large: '17.5px' };
    document.documentElement.style.fontSize = scaleMap[fontScale] || '16px';
  }, [fontScale, isLoaded]);

  // 日历轮播
  useEffect(() => {
    const timer = setInterval(() => setCalendarLogoTick(prev => prev + 1), 1800);
    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string, type: string = 'success') => {
    setToastMsg({ text, type: type as 'success' | 'error' | 'info' });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    if (style === 'light') navigator.vibrate(15);
    else if (style === 'medium') navigator.vibrate(30);
    else if (style === 'heavy') navigator.vibrate(50);
    else if (style === 'success') navigator.vibrate([100, 60, 200]);
  };

  const {
    handleSaveReceipt, handleShareReceipt, handleShareAchievement,
    handleExportData, handleImportData, handleCompressHistory
  } = useExportActions({
    records, setRecords, prefLanguage, isDark, selectedAchv, showToast, triggerHaptic
  });

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

  const openAddModal = () => {
    setEditingRecord(null);
    triggerHaptic('light');
    setShowAddModal(true);
  };

  const openEditModal = (record: DrinkRecord) => {
    setEditingRecord(record);
    triggerHaptic('light');
    setShowAddModal(true);
  };

  // 🌟 使用全局 Store 更新记录
  const handleSaveDrink = async (newRecord: DrinkRecord, isEditing: boolean) => {
    if (newRecord.imageUrl && newRecord.imageUrl.startsWith('data:image/')) {
      const ext = newRecord.imageUrl.substring("data:image/".length, newRecord.imageUrl.indexOf(";base64"));
      const filename = `boba_${Date.now()}.${ext || 'jpg'}`;
      newRecord.imageUrl = await saveImageToDisk(newRecord.imageUrl, filename);
    }

    const newRecords = isEditing
      ? records.map(r => r.id === newRecord.id ? { ...newRecord } : r)
      : [...records, newRecord];

    if (!isEditing) {
      const oldUnlocked = getAchievementsData(records).unlockedMap;
      const newUnlocked = getAchievementsData(newRecords).unlockedMap;
      let newlyUnlockedId = null;
      for (const key of newUnlocked.keys()) {
        if (!oldUnlocked.has(key)) { newlyUnlockedId = key; break; }
      }
      if (newlyUnlockedId) {
        triggerHaptic('success');
        setAchievementBanner(newlyUnlockedId);
        setTimeout(() => setAchievementBanner(null), 5000);
      } else {
        triggerHaptic('medium');
      }
    } else {
      triggerHaptic('light');
    }

    setRecords(newRecords); // 自动触发本地缓存
    setShowAddModal(false);
  };
  const handleDeleteDrink = async (recordToDelete: DrinkRecord) => {
    triggerHaptic('medium');
    // 如果是一张物理磁盘图片，先从硬盘抹除
    if (recordToDelete.imageUrl && !recordToDelete.imageUrl.startsWith('data:image/')) {
      await deleteImageFromDisk(recordToDelete.imageUrl);
    }
    setRecords(records.filter(r => r.id !== recordToDelete.id));
  };

  const handleShare = (record: DrinkRecord) => {
    setShareRecord(record);
  };

  const disciplineStats = calculateDisciplineStats(records);
  const [showStreakAnim, setShowStreakAnim] = useState(false);
  const [lastStreak, setLastStreak] = useState(-1);

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

  const nextMilestone = disciplineStats ? (disciplineStats.streak < 3 ? 3 : disciplineStats.streak < 7 ? 7 : disciplineStats.streak < 14 ? 14 : disciplineStats.streak < 21 ? 21 : Math.ceil((disciplineStats.streak + 1) / 7) * 7) : 3;
  const streakProgress = disciplineStats ? (disciplineStats.streak / nextMilestone) * 100 : 0;

  if (!currentDate) return <div className="h-screen w-full bg-bg-app"></div>;

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
  const activeDay = selectedDay || currentDay;
  const sortedMonthRecords = [...currentMonthRecords].sort((a, b) => {
    if (b.day !== a.day) return b.day - a.day;
    const aTime = Number.parseInt(a.id, 10);
    const bTime = Number.parseInt(b.id, 10);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
  const visibleRecords = sortedMonthRecords;

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-bg-app flex flex-col font-sans text-text-main sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main sm:shadow-2xl relative">
      <div className={`flex-1 w-full relative ${activeTab === 'home' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto pb-36 custom-scrollbar scroll-smooth'}`}>

        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full w-full">
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

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-36 custom-scrollbar relative">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>{`${currentMonth + 1}月奶茶`}</span>
                <span className="text-sm font-medium text-text-muted">{visibleRecords.length} 杯</span>
              </h2>
              <div className={cardDensity === "compact" ? "space-y-2.5" : "space-y-4"}>
                {visibleRecords.length === 0 ? (
                  <div className="bg-bg-card rounded-[24px] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <p className="text-text-muted text-sm font-medium">本月还没有喝奶茶</p>
                  </div>
                ) : (
                  visibleRecords.map((record, index) => {
                    const recordDateString = `${record.month + 1}月${record.day}日`;
                    const showDateHeader = index === 0 || visibleRecords[index - 1].day !== record.day;
                    return (
                      <div key={record.id} className={`space-y-2 ${showDateHeader ? 'mt-2' : '-mt-1'}`}>
                        {showDateHeader && <div id={`record-date-${record.day}`} className="text-lg font-black tracking-tight text-text-main ml-1 mt-4 mb-2">{recordDateString}</div>}
                        <div className="relative overflow-hidden rounded-[24px]">
                          <div className="absolute inset-0 bg-bg-input flex justify-end items-center px-4 gap-3">
                            <button onClick={() => openEditModal(record)} className="w-12 h-12 rounded-full bg-[#3B82F6] text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"><Edit2 size={18} /></button>
                            <button onClick={() => handleShare(record)} className="w-12 h-12 rounded-full bg-border-main text-text-main flex items-center justify-center active:scale-95 transition-transform shadow-sm"><Share size={18} /></button>
                            <button onClick={() => handleDeleteDrink(record)} className="w-12 h-12 rounded-full bg-[#EF4444] text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"><Trash2 size={18} /></button>
                          </div>
                          <motion.div drag="x" dragConstraints={{ left: -200, right: 0 }} dragElastic={0.1} className={`bg-bg-card flex items-center relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${cardDensity === "compact" ? "p-3 gap-3" : "p-4 gap-4"}`}>
                            <div className="w-14 h-16 flex-shrink-0 flex items-center justify-center">
                              {isExportableImageSrc(record.imageUrl) ? (<img src={record.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-sm scale-110" />) : (<Coffee size={44} className="text-text-muted" strokeWidth={1.8} />)}
                            </div>
                            {/* 🚀 加入了 min-w-0 和 break-words，支持超长名字自动换行 */}
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
                            <div className="flex flex-col items-end justify-center h-full gap-1">
                              <span className="font-bold theme-text text-lg">￥{record.cost}</span>
                              <span className="flex items-center gap-1 text-[10px] bg-bg-input px-2 py-0.5 rounded text-text-muted font-medium"><span>{record.sweetness || '标准糖'}</span><span>/</span><span>{record.temperature || '正常冰'}</span></span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
        <div />

{activeTab === 'stats' && (
          <StatsTab
            records={records} currentDate={currentDate} setCurrentDate={setCurrentDate} prefLanguage={prefLanguage}
            themeAccent={themeAccent} weekStart={weekStart} weeklyBudget={weeklyBudget} weeklyCupLimit={weeklyCupLimit}
            monthlyBudget={monthlyBudget} monthlyCupLimit={monthlyCupLimit} triggerHaptic={triggerHaptic}
            showToast={showToast} handleSaveReceipt={handleSaveReceipt} handleShareReceipt={handleShareReceipt}
            showStatsReceipt={showStatsReceipt} setShowStatsReceipt={setShowStatsReceipt}
            showStatsPoster={showStatsPoster} setShowStatsPoster={setShowStatsPoster}
            statsSelectedRecord={statsSelectedRecord} setStatsSelectedRecord={setStatsSelectedRecord}
          />
        )}

        {/* 🌟 4. 完美的 Props 向下传递：没有任何报错了！ */}
        {activeTab === 'settings' && (
          <SettingsTab
            records={records}
            themeMode={themeMode} setThemeMode={setThemeMode}
            prefLanguage={prefLanguage} setPrefLanguage={setPrefLanguage}
            themeAccent={themeAccent} setThemeAccent={setThemeAccent}
            fontScale={fontScale} setFontScale={setFontScale}
            cardDensity={cardDensity} setCardDensity={setCardDensity}
            weekStart={weekStart} setWeekStart={setWeekStart}
            calendarImageMode={calendarImageMode} setCalendarImageMode={setCalendarImageMode}
            defaultTemp={defaultTemp} setDefaultTemp={setDefaultTemp}
            defaultSweet={defaultSweet} setDefaultSweet={setDefaultSweet}
            weeklyBudget={weeklyBudget} setWeeklyBudget={setWeeklyBudget}
            weeklyCupLimit={weeklyCupLimit} setWeeklyCupLimit={setWeeklyCupLimit}
            monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget}
            monthlyCupLimit={monthlyCupLimit} setMonthlyCupLimit={setMonthlyCupLimit}
            setShowAchievementsModal={setShowAchievementsModal}
            setShowAboutUsModal={setShowAboutUsModal}
            handleCompressHistory={handleCompressHistory}
            handleExportData={handleExportData}
            handleImportData={handleImportData}
            triggerHaptic={triggerHaptic}
            showToast={showToast}
          />
        )}
      </div>

      <AddDrinkFormModal
        isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSaveDrink} editingRecord={editingRecord}
        currentDate={currentDate} selectedDay={selectedDay} defaultTemp={defaultTemp} defaultSweet={defaultSweet}
        triggerHaptic={triggerHaptic} showToast={showToast}
      />

      <AnimatePresence>
        {showAboutUsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-bg-card w-full max-w-[320px] rounded-[32px] shadow-2xl relative flex flex-col p-8 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#8E7558]/20 to-transparent"></div>
              <button onClick={() => setShowAboutUsModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors z-10"><X size={18} strokeWidth={2.5} /></button>
              <div className="flex flex-col items-center justify-center mb-6 relative z-10"><div className="mb-4 drop-shadow-md"><Coffee size={56} className="theme-text" strokeWidth={1.8} /></div><h2 className="text-2xl font-black tracking-tight text-text-main mb-1">Sugar Log</h2><div className="text-sm font-medium theme-text">Version 1.0.0</div></div>
              <div className="text-center text-[15px] leading-relaxed text-text-muted mb-8 relative z-10">{prefLanguage === 'English' ? (<><p className="mb-4">A simple, beautiful way to track your daily sugar intake.</p><p>Crafted for sugar lovers everywhere. Our mission is to help you remember every perfect sip and sweet moment.</p></>) : (<><p className="mb-4">一个简洁的老糖人奶茶App。</p><p>为全世界的老糖人爱好者用心打造。我们的使命是帮你记住每一口糖。</p></>)}</div>
              <div className="flex justify-center gap-4 relative z-10"><a href="https://github.com/czdyph/laotangren-app" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-text-main hover:theme-bg hover:text-white transition-colors"><Info size={18} strokeWidth={2.2} /></a><a href="mailto:yhdp921@gmail.com" className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-text-main hover:theme-bg hover:text-white transition-colors"><MessageSquare size={18} strokeWidth={2.2} /></a></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SingleReceiptModal shareRecord={shareRecord} setShareRecord={setShareRecord} prefLanguage={prefLanguage} singleReceiptRef={singleReceiptRef} handleSaveReceipt={handleSaveReceipt} handleShareReceipt={handleShareReceipt} />

      <AnimatePresence>
        {showAchievementsModal && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed inset-0 z-[120] bg-bg-app flex flex-col sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main">
            {(() => {
              const { achievementsList } = getAchievementsData(records);
              const unlockedCount = achievementsList.filter(a => a.isUnlocked).length;
              return (
                <>
                  <div className="flex items-center justify-between px-6 pb-4 bg-bg-app z-20 pt-[calc(env(safe-area-inset-top)+24px)]">
                    <div className="flex flex-col"><h2 className="text-3xl font-black text-text-main tracking-tight mb-1">{prefLanguage === 'English' ? 'Achievements' : '成就图鉴'}</h2><span className="text-sm font-bold theme-text">已解锁: {unlockedCount} / {achievementsList.length}</span></div>
                    <button onClick={() => setShowAchievementsModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors shadow-sm"><X size={20} strokeWidth={2.5} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 py-2 pb-10 custom-scrollbar relative">
                    <div className="w-full h-2 bg-bg-input rounded-full mb-6 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(unlockedCount / achievementsList.length) * 100}%` }} transition={{ duration: 1 }} className="h-full theme-gradient rounded-full" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      {achievementsList.map((ach, idx) => (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} key={ach.id} onClick={() => { if (ach.isUnlocked) { triggerHaptic('medium'); setSelectedAchv(ach); } else { triggerHaptic('light'); showToast('还差一点哦，继续喝起来吧！', 'info'); } }} className={`relative p-4 rounded-[24px] border-2 flex flex-col items-center text-center transition-all overflow-hidden ${ach.isUnlocked ? 'bg-bg-card theme-border/30 shadow-[0_4px_15px_rgba(142,117,88,0.1)] cursor-pointer hover:scale-105 active:scale-95' : 'bg-bg-input/30 border-transparent grayscale opacity-50 cursor-not-allowed'}`}>
                          {ach.isUnlocked && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 theme-bg/10 rounded-full blur-xl pointer-events-none"></div>}
                          <div className="text-4xl mb-3 mt-2 relative z-10 drop-shadow-md">{ach.isUnlocked ? ach.icon : '🔒'}</div>
                          <div className={`font-black text-sm mb-1 z-10 ${ach.isUnlocked ? 'text-text-main' : 'text-text-muted'}`}>{ach.title}</div>
                          <div className="text-[10px] text-text-muted font-medium z-10">{ach.desc}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {achievementBanner && (() => {
          const achvData = getAchievementsData(records).achievementsList.find(a => a.id === achievementBanner);
          if (!achvData) return null;
          return (
            <motion.div initial={{ y: -100, opacity: 0, scale: 0.95 }} animate={{ y: 24, opacity: 1, scale: 1 }} exit={{ y: -100, opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 18, stiffness: 250 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] w-[92%] max-w-[360px] cursor-pointer" onClick={() => { triggerHaptic('light'); setAchievementBanner(null); setSelectedAchv(achvData); }}>
              <div className={`relative overflow-hidden rounded-[20px] border p-4 flex items-center gap-4 shadow-2xl ${isDark ? 'bg-[#161618] border-[#D2B48C]/40 shadow-black/60' : 'bg-white theme-border/20 shadow-[#8E7558]/15'}`}>
                <motion.div initial={{ x: '-150%' }} animate={{ x: '200%' }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.5 }} className={`absolute inset-y-0 w-1/2 skew-x-12 pointer-events-none ${isDark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-white/40 to-transparent'}`} />
                <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isDark ? 'bg-[#D2B48C]/20' : 'theme-bg/10'}`}></div>
                <div className="w-12 h-12 rounded-full theme-gradient flex items-center justify-center text-2xl shrink-0 shadow-inner z-10 border border-[#D2B48C]/50">{achvData.icon}</div>
                <div className="flex-1 min-w-0 relative z-10">
                  <div className={`text-[10px] font-black tracking-widest uppercase mb-0.5 drop-shadow-md ${isDark ? 'text-[#D2B48C]' : 'theme-text'}`}>Achievement Unlocked</div>
                  <div className={`font-bold text-base truncate drop-shadow-md ${isDark ? 'text-white' : 'text-[#1a1a1e]'}`}>{achvData.title}</div>
                  <div className={`text-[11px] truncate mt-0.5 font-medium ${isDark ? 'text-white/60' : 'text-text-muted'}`}>{achvData.desc}</div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ y: -100, opacity: 0, scale: 0.95 }} animate={{ y: 24, opacity: 1, scale: 1 }} exit={{ y: -100, opacity: 0, scale: 0.95 }} transition={{ type: "spring", damping: 18, stiffness: 250 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-[360px] cursor-pointer" onClick={() => setToastMsg(null)}>
            <div className={`relative overflow-hidden rounded-[20px] border p-4 flex items-center gap-4 shadow-2xl ${isDark ? 'bg-[#161618] theme-border-soft shadow-[0_30px_60px_rgba(0,0,0,0.6)]' : 'bg-white theme-border-soft shadow-[0_20px_40px_rgba(0,0,0,0.08)]'}`}>
              <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl pointer-events-none ${toastMsg?.type === 'error' ? 'bg-red-500/15' : 'theme-bg-soft'}`}></div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-inner z-10 border ${toastMsg.type === 'error' ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-300' : 'theme-gradient border-[#D2B48C]/50'}`}>
                {toastMsg.type === 'error' ? '⚠️' : toastMsg.type === 'info' ? '💡' : '✨'}
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className={`text-[10px] font-black tracking-widest uppercase mb-0.5 drop-shadow-md ${toastMsg.type === 'error' ? 'text-red-500' : isDark ? 'text-[#D2B48C]' : 'theme-text'}`}>
                  {toastMsg.type === 'error' ? (prefLanguage === 'English' ? 'System Error' : '错误提示') : toastMsg.type === 'info' ? (prefLanguage === 'English' ? 'Message' : '老糖人语录') : (prefLanguage === 'English' ? 'Success' : '操作成功')}
                </div>
                <div className={`font-bold text-[13px] leading-snug drop-shadow-md break-words ${isDark ? 'text-white' : 'text-[#1a1a1e]'}`}>{toastMsg.text}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAchv && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            {/* 🚀 加入海报卡片的右滑关闭引擎 */}
            <motion.div
              id="achievement-card"
              initial={{ scale: 0.8, y: 20, rotateX: 20, x: 50 }}
              animate={{ scale: 1, y: 0, rotateX: 0, x: 0 }}
              exit={{ scale: 0.8, y: 20, opacity: 0, x: "100%" }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 0.8 }}
              onDragEnd={(e, info) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                  setSelectedAchv(null);
                }
              }}
              className="w-full max-w-[340px] bg-bg-card rounded-[32px] p-6 relative shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col items-center text-center overflow-hidden border border-border-main/50"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 theme-bg-soft rounded-full blur-3xl pointer-events-none"></div>
              <div className="text-[64px] mb-2 relative z-10 drop-shadow-xl filter">{selectedAchv.icon}</div>
              <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight relative z-10">{selectedAchv.title}</h2>
              <div className="text-[11px] font-bold theme-text mb-6 relative z-10 theme-bg-soft px-3 py-1 rounded-full">{selectedAchv.buildText(selectedAchv.trigger).date}</div>
              <div className="w-full bg-bg-input/60 rounded-[20px] p-3 flex items-center gap-4 mb-6 shadow-inner relative z-10 border border-border-main/50">
                <div className="w-16 h-20 shrink-0 bg-white/50 rounded-xl flex items-center justify-center shadow-sm p-1">
                  {isExportableImageSrc(selectedAchv.trigger.imageUrl) ? (<img src={selectedAchv.trigger.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-md scale-110" />) : (<Coffee size={32} className="text-text-muted" strokeWidth={1.8} />)}
                </div>
                <div className="flex-1 flex flex-col justify-center items-start text-left">
                  <div className="flex items-center gap-1.5 mb-1.5"><span className="text-[10px] text-text-muted font-bold tracking-widest">关键见证者</span>{selectedAchv.trigger.brand && (<><span className="text-[10px] text-border-main/80">|</span><span className="text-[10px] font-bold theme-text">{selectedAchv.trigger.brand}</span></>)}</div>
                  <div className="font-black text-[15px] text-text-main leading-snug mb-2 w-full break-words whitespace-normal line-clamp-2">{selectedAchv.trigger.type}</div>
                  <div className="text-[10px] theme-text font-medium theme-bg/10 px-2 py-0.5 rounded-md">{selectedAchv.trigger.size || '中杯'} · {selectedAchv.trigger.temperature || '正常冰'} · {selectedAchv.trigger.sweetness || '标准糖'}</div>
                </div>
              </div>
              <p className="text-[14px] text-text-main leading-relaxed font-medium mb-8 relative z-10 opacity-90">{selectedAchv.buildText(selectedAchv.trigger).comment}</p>
              <button onClick={handleShareAchievement} className="w-full theme-gradient text-white py-3.5 rounded-full font-bold shadow-[0_8px_20px_rgba(142,117,88,0.3)] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2"><Share size={18} />分享我的高光时刻</button>
              <button onClick={() => setSelectedAchv(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-input/80 flex items-center justify-center text-text-muted hover:text-text-main transition-colors z-20"><X size={18} strokeWidth={3} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} records={records} prefLanguage={prefLanguage} themeAccent={themeAccent} openEditModal={openEditModal} />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-card/80 backdrop-blur-xl border border-border-main/80 rounded-full px-2 py-2 flex items-center gap-2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <button onClick={() => setActiveTab('home')} className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-bg-input theme-text shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}><Coffee size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} /></button>
        <button onClick={() => setActiveTab('stats')} className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'stats' ? 'bg-bg-input theme-text shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}><BarChart3 size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} /></button>
        <button onClick={() => setActiveTab('settings')} className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'settings' ? 'bg-bg-input theme-text shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}><SettingsIcon size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} /></button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        :root { --theme-color: ${themeAccent}; }
        .theme-bg { background-color: var(--theme-color) !important; color: #ffffff !important; }
        .hover\\:theme-bg:hover { background-color: var(--theme-color) !important; color: #ffffff !important; }
        .theme-text { color: var(--theme-color) !important; }
        .theme-border { border-color: var(--theme-color) !important; }
        .theme-ring { --tw-ring-color: var(--theme-color) !important; box-shadow: 0 0 0 2px var(--tw-ring-color) !important; }
        .theme-bg-soft { background-color: color-mix(in srgb, var(--theme-color) 15%, transparent) !important; color: var(--theme-color) !important; }
        .theme-border-soft { border-color: color-mix(in srgb, var(--theme-color) 30%, transparent) !important; }
        .group:hover .group-hover\\:theme-border { border-color: var(--theme-color) !important; }
        .theme-gradient { background: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color) 75%, white)) !important; }
        .theme-gradient-v { background: linear-gradient(to bottom, color-mix(in srgb, var(--theme-color) 75%, white), var(--theme-color)) !important; }
        .theme-shadow { box-shadow: 0 8px 20px color-mix(in srgb, var(--theme-color) 30%, transparent) !important; }
        .custom-scrollbar::-webkit-scrollbar { display: none; width: 0px; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div >
  );
}