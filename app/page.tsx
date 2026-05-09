"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, BarChart3, Settings as SettingsIcon, Plus, Edit2, Share, Trash2, ChevronLeft, ChevronRight, MessageSquare, Info, Flame, X, Search, Trophy } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useExportActions } from '@/hooks/useExportActions';
import { saveImageToDisk, initImageDirectory, deleteImageFromDisk } from '@/utils/fileManager';
import { App as CapApp } from '@capacitor/app';
import HomeTab from '@/components/HomeTab';
import GyroCard from '@/components/GyroCard';
import GooeyTabBar from '@/components/GooeyTabBar';

// 👇 引入我们的新架构
import { useStore } from '@/store/useStore';
import { useImmersiveStatusBar } from '@/hooks/useImmersiveStatusBar';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useAutoTheme } from '@/hooks/useAutoTheme';

import { DrinkRecord } from "@/types";
import { getBrandKey, getBrandLogoFile, isExportableImageSrc, compressBase64Image, waitForReceiptAssets, getAchievementsData } from '@/utils/helpers';
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
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showStatsReceipt, setShowStatsReceipt] = useState(false);
  const [showStatsPoster, setShowStatsPoster] = useState(false);
  const [statsSelectedRecord, setStatsSelectedRecord] = useState<DrinkRecord | null>(null);

  const [toastMsg, setToastMsg] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [achievementBanner, setAchievementBanner] = useState<string | null>(null);
  const singleReceiptRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    const scaleMap: any = { small: '14px', medium: '15px', large: '16px' };
    document.documentElement.style.fontSize = scaleMap[fontScale] || '16px';
  }, [fontScale, isLoaded]);


// 🌟 升级版 Toast 引擎：防冲突、防误杀
  const showToast = (text: string, type: string = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg({ text, type: type as 'success' | 'error' | 'info' });
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3000);
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

// 🌟 智能成就进度计算引擎 (修复了空品牌连击与负数 Bug)
  const getLockedMessage = (ach: any, records: DrinkRecord[], prefLang: string) => {
    const totalCups = records.length;
    const title = ach.title || '';

    // 辅助函数：防止出现负数，保底显示还差 1 杯
    const getDiff = (target: number, current: number) => Math.max(1, target - current);

    if (title.includes('初次') || title.includes('First')) {
      return prefLang === 'English' ? `Just 1 more cup to go!` : `还差 ${getDiff(1, totalCups)} 杯，快去记录你的第一杯！`;
    }
    if (title.includes('死忠') || title.includes('Loyal')) {
      let maxStreak = 0; let currentStreak = 0; let currentBrand = '';
      
      // 🚀 修复 1：必须先按真实的年月日排序，才能准确计算“连续”
      const sortedRecords = [...records].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          if (a.month !== b.month) return a.month - b.month;
          if (a.day !== b.day) return a.day - b.day;
          return Number(a.id) - Number(b.id);
      });

      sortedRecords.forEach(r => {
        // 🚀 修复 2：只有当 brand 存在且不是空字符串时，才参与连击计算
        if (r.brand && r.brand === currentBrand) { 
            currentStreak++; 
            maxStreak = Math.max(maxStreak, currentStreak); 
        } else if (r.brand) { 
            currentBrand = r.brand; 
            currentStreak = 1; 
            maxStreak = Math.max(maxStreak, currentStreak); 
        } else {
            // 遇到没写品牌的，直接中断连击
            currentBrand = '';
            currentStreak = 0;
        }
      });
      const diff = getDiff(7, maxStreak);
      return prefLang === 'English' ? `Max streak: ${maxStreak}. Need ${diff} more!` : `最高连饮 ${maxStreak} 杯同品牌，还差 ${diff} 杯！`;
    }
    if (title.includes('海王') || title.includes('Explorer')) {
      const brandCount = new Set(records.map(r => r.brand).filter(Boolean)).size;
      return prefLang === 'English' ? `Tried ${brandCount} brands. Need ${getDiff(15, brandCount)} more!` : `已品尝 ${brandCount} 个品牌，还差 ${getDiff(15, brandCount)} 个新品牌！`;
    }
    if (title.includes('苦行僧') || title.includes('Sugar')) {
      const sugarFreeCount = records.filter(r => r.sweetness?.includes('无糖') || r.sweetness?.includes('不加') || r.sweetness?.includes('不另外加糖')).length;
      return prefLang === 'English' ? `Had ${sugarFreeCount} sugar-free cups. Need ${getDiff(50, sugarFreeCount)} more!` : `已喝 ${sugarFreeCount} 杯无糖，还差 ${getDiff(50, sugarFreeCount)} 杯苦修！`;
    }
    if (title.includes('绝对零度') || title.includes('Cold')) {
      const coldCount = records.filter(r => r.temperature?.includes('冰') || r.temperature?.includes('冷')).length;
      return prefLang === 'English' ? `Had ${coldCount} cold cups. Need ${getDiff(100, coldCount)} more!` : `已喝 ${coldCount} 杯冷饮，还差 ${getDiff(100, coldCount)} 杯透心凉！`;
    }
    if (title.includes('养生') || title.includes('Hot')) {
      const hotCount = records.filter(r => r.temperature?.includes('热') || r.temperature?.includes('温')).length;
      return prefLang === 'English' ? `Had ${hotCount} hot cups. Need ${getDiff(100, hotCount)} more!` : `已喝 ${hotCount} 杯热饮，还差 ${getDiff(100, hotCount)} 杯温暖！`;
    }
    if (title.includes('破产') || title.includes('Broke')) {
      return prefLang === 'English' ? `Buy a drink over ￥15!` : `还差一杯价格超过 15 元的奢华饮品，去挥霍一次吧！`;
    }
    if (title.includes('土匪') || title.includes('Bandit')) {
      return prefLang === 'English' ? `Total ${totalCups} cups. Need ${getDiff(200, totalCups)} more!` : `已记录 ${totalCups} 杯，还差 ${getDiff(200, totalCups)} 杯就能称霸！`;
    }

    return prefLang === 'English' ? 'Almost there, keep drinking!' : '还差一点哦，继续喝起来吧！';
  };

  if (!currentDate) return <div className="h-screen w-full bg-bg-app"></div>;

  return (
    <div className="w-full h-[100dvh] overflow-hidden bg-bg-app flex flex-col font-sans text-text-main sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main sm:shadow-2xl relative">
      <div className={`flex-1 w-full relative ${activeTab === 'home' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto pb-36 custom-scrollbar scroll-smooth'}`}>

        {activeTab === 'home' && (
          <HomeTab
            records={records}
            currentDate={currentDate} setCurrentDate={setCurrentDate}
            selectedDay={selectedDay} setSelectedDay={setSelectedDay}
            weekStart={weekStart} cardDensity={cardDensity}
            calendarImageMode={calendarImageMode} themeAccent={themeAccent}
            setShowHistoryModal={setShowHistoryModal} openAddModal={openAddModal}
            openEditModal={openEditModal} handleDeleteDrink={handleDeleteDrink}
            handleShare={handleShare} triggerHaptic={triggerHaptic}
            showToast={showToast} isLoaded={isLoaded}
          />
        )}

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
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} key={ach.id}
                          onClick={() => {
                            if (ach.isUnlocked) {
                              triggerHaptic('medium');
                              setSelectedAchv(ach);
                            } else {
                              triggerHaptic('light');
                              // 🚀 核心替换：调用智能进度函数，实时算出还能差几杯
                              showToast(getLockedMessage(ach, records, prefLanguage), 'info');
                            }
                          }} className={`relative p-4 rounded-[24px] border-2 flex flex-col items-center text-center transition-all overflow-hidden ${ach.isUnlocked ? 'bg-bg-card theme-border/30 shadow-[0_4px_15px_rgba(142,117,88,0.1)] cursor-pointer hover:scale-105 active:scale-95' : 'bg-bg-input/30 border-transparent grayscale opacity-50 cursor-not-allowed'}`}>
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
            {/* 🚀 加入海报卡片的右滑关闭引擎 (外层只负责拖拽和透视) */}
            <motion.div
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
              className="w-full max-w-[340px] perspective-[1200px]"
            >
              {/* 🚀 装入 3D 陀螺仪引擎 */}
              <GyroCard className="w-full h-full">
                <div id="achievement-card" className="w-full h-full bg-bg-card rounded-[32px] p-6 relative shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col items-center text-center overflow-hidden border border-border-main/50">
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
                </div>
              </GyroCard>

              {/* 💡 关闭按钮放在最外层，避免被 3D 旋转带偏，防止手指点不到 */}
              <button onClick={() => setSelectedAchv(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-input/80 flex items-center justify-center text-text-muted hover:text-text-main transition-colors z-20"><X size={18} strokeWidth={3} /></button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HistoryModal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} records={records} prefLanguage={prefLanguage} themeAccent={themeAccent} openEditModal={openEditModal} />

      {/* 🚀 注入大厂级流体果冻底栏 */}
      <GooeyTabBar activeTab={activeTab} setActiveTab={setActiveTab} triggerHaptic={triggerHaptic} />

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