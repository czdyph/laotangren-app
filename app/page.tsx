"use client";

import React, { useState, useRef, useEffect } from "react";
import localforage from 'localforage';
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, BarChart3, Settings as SettingsIcon, Plus, Edit2, Share, Trash2, ChevronLeft, ChevronRight, MessageSquare, Info, Flame, X, Search, Trophy} from "lucide-react";
import * as htmlToImage from 'html-to-image';

interface DrinkRecord {
  id: string;
  imageUrl: string;
  day: number;
  month: number;
  year: number;
  cost: number;
  brand?: string;
  type: string; // name
  size?: string;
  temperature?: string;
  sweetness?: string;
}

interface BrandMetricItem {
  brand: string;
  cups: number;
  cost: number;
  ratio: number;
}

const getBrandKey = (brand: string) => {
  if (!brand) return null;
  const lowerBrand = brand.toLowerCase();

  const rules: Record<string, string[]> = {
    CoCo: ["coco", "都可"],
    霸王茶姬: ["霸王茶姬", "bwcj","bw"],
    茶百道: ["茶百道", "cbd","cb"],
    茶话弄: ["茶话弄", "chn","ch"],
    古茗: ["古茗", "gm"],
    沪上阿姨: ["沪上阿姨", "hsay","hs"],
    眷茶: ["眷茶", "jc"],
    库迪咖啡: ["库迪", "kd"],
    蜜雪冰城: ["蜜雪冰城", "mxbc","mx"],
    茉莉奶白: ["茉莉奶白", "mlnb","ml"],
    奈雪: ["奈雪", "nx"],
    瑞幸: ["瑞幸", "rx"],
    书亦烧仙草: ["书亦烧仙草", "sysxc","sys"],
    喜茶: ["喜茶", "xc"],
    幸运咖: ["幸运咖", "xyk","xy"],
    爷爷不泡茶: ["爷爷不泡茶", "yybpc","yy"],
    一点点: ["一点点", "ydd"],
    益禾堂: ["益禾堂", "yht","yh"],
    柠季: ["柠季", "nj"],
    陆藜: ["陆藜", "ll"],
    甜啦啦: ["甜啦啦", "tll"],
    阿水大杯茶: ["阿水大杯茶", "asdbc","as"],
    冰淳茶饮: ["冰淳茶饮", "bccy","bc"],
    挪瓦咖啡: ["挪瓦咖啡", "nv"]
  };

  for (const [key, keywords] of Object.entries(rules)) {
    if (keywords.some(k => lowerBrand.includes(k))) {
      return key;
    }
  }

  return null;
};

const getBrandLogoFile = (brand: string) => {
  const key = getBrandKey(brand);
  if (!key) return null;
  const logos: Record<string, string> = {
    CoCo: "coco.png",
    霸王茶姬: "霸王茶姬.png",
    茶百道: "茶百道.png",
    茶话弄: "茶话弄.png",
    古茗: "古茗.png",
    沪上阿姨: "沪上阿姨.png",
    眷茶: "眷茶.png",
    库迪咖啡: "库迪咖啡.png",
    蜜雪冰城: "蜜雪冰城.png",
    茉莉奶白: "茉莉奶白.png",
    奈雪: "奈雪.png",
    瑞幸: "瑞幸.png",
    书亦烧仙草: "书亦烧仙草.png",
    喜茶: "喜茶.png",
    幸运咖: "幸运咖.png",
    爷爷不泡茶: "爷爷不泡茶.png",
    一点点: "一点点.png",
    益禾堂: "益禾堂.png",
    柠季: "柠季.png",
    陆藜: "陆藜.png",
    甜啦啦: "甜啦啦.png",
    阿水大杯茶: "阿水大杯茶.png",
    冰淳茶饮: "冰淳茶饮.png",
    挪瓦咖啡: "挪瓦咖啡.png"
  };
  return logos[key] || null;
};

const getSweetnessOptions = (brand: string) => {
  const brandKey = getBrandKey(brand);
  if (brandKey === "瑞幸") {
    return ["不另外加糖", "微甜", "少少甜", "少甜", "标准甜"];
  }
  if (brandKey === "库迪咖啡") {
    return ["不额外加糖", "1/4糖", "半糖", "全糖"];
  }
  if (brandKey === "眷茶") {
    return ["不另外加糖", "少少糖", "少糖", "标准糖"];
  }
  if (brandKey === "茶话弄") {
    return ["不另外加糖", "少少少甜", "少少甜", "少甜", "标准甜"];
  }
  if (brandKey === "霸王茶姬") {
    return ["不另外加糖", "微糖", "半糖", "少糖", "标准糖"];
  }
  if (brandKey === "喜茶") {
    return ["不另外加甜", "少少少甜", "少少甜", "少甜"];
  }
  if (brandKey === "奈雪") {
    return ["不另外加糖", "微甜", "少少甜", "少甜", "正常甜"];
  }
  if (brandKey === "书亦烧仙草") {
    return ["不另外加糖", "少少糖", "少糖", "标准糖"];
  }
  if (brandKey === "幸运咖") {
    return ["不另外加糖", "半糖", "标准糖"];
  }
  if (brandKey === "陆藜") {
    return ["无糖", "少糖", "正常糖"];
  }
  return ["不另外加糖", "三分糖", "五分糖", "七分糖", "标准糖"];
};

const isExportableImageSrc = (src?: string) => {
  if (!src || src.length <= 2) return false;
  return !src.startsWith("blob:");
};

// 🌟 核心优化：静默图片压缩 (将 5MB 缩小到 100KB 以内)
const compressImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 如果图片超宽，等比例缩放
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string); // 兜底：如果canvas失败，返回原图
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        // 核心：强制转换为 webp 格式并降低质量到 80%，极大减小体积
        resolve(canvas.toDataURL('image/webp', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
// 🌟 针对历史存量数据的压缩函数 (把庞大的老 Base64 转成小巧的 webp 格式)
const compressBase64Image = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.onerror = (error) => reject(error);
  });
};

const waitForReceiptAssets = async (element: HTMLElement) => {
  await document.fonts?.ready;
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(async image => {
      if (image.complete) return;
      try {
        await image.decode();
      } catch {
        // Broken images should not block receipt export.
      }
    })
  );
};

export default function App() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'stats' | 'settings'>('home');
  const [statPeriod, setStatPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [brandDonutMode, setBrandDonutMode] = useState<'cups' | 'cost'>('cups');
  const [statAnimationKey, setStatAnimationKey] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [records, setRecords] = useState<DrinkRecord[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [selectedAchv, setSelectedAchv] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareRecord, setShareRecord] = useState<DrinkRecord | null>(null);
  const singleReceiptRef = useRef<HTMLDivElement>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [draftImage, setDraftImage] = useState<string>('??');
  const [draftDate, setDraftDate] = useState<string>(''); // 新增：用于表单的日期状态
  const [draftBrand, setDraftBrand] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftCost, setDraftCost] = useState('');
  const [draftSize, setDraftSize] = useState('中杯');
  const [draftTemperature, setDraftTemperature] = useState('正常冰');
  const [draftSweetness, setDraftSweetness] = useState('标准糖');
  const [monthDirection, setMonthDirection] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [prefLanguage, setPrefLanguage] = useState('中文');
  const [defaultTemp, setDefaultTemp] = useState('正常冰');
  const [defaultSweet, setDefaultSweet] = useState('标准糖');
  const [themeAccent, setThemeAccent] = useState('#8E7558');
  const [fontScale, setFontScale] = useState<'small' | 'medium' | 'large'>('medium');
  const [cardDensity, setCardDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [weekStart, setWeekStart] = useState<'sunday' | 'monday'>('sunday');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [weeklyCupLimit, setWeeklyCupLimit] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [monthlyCupLimit, setMonthlyCupLimit] = useState('');
  const [calendarImageMode, setCalendarImageMode] = useState<'brand' | 'upload'>('brand');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [calendarLogoTick, setCalendarLogoTick] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  // 👉 1. 新增 Toast 状态和触发函数
  const [toastMsg, setToastMsg] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000); // 3秒后自动消失
  };

  // 👇 请插入这部分震动辅助函数 👇
  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window === 'undefined' || !navigator.vibrate) return;
    if (style === 'light') navigator.vibrate(15);
    else if (style === 'medium') navigator.vibrate(30);
    else navigator.vibrate(50);
  };

  
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wB = localStorage.getItem('boba_weeklyBudget'); if (wB) setWeeklyBudget(wB);
      const wCL = localStorage.getItem('boba_weeklyCupLimit'); if (wCL) setWeeklyCupLimit(wCL);
      const mB = localStorage.getItem('boba_monthlyBudget'); if (mB) setMonthlyBudget(mB);
      const mCL = localStorage.getItem('boba_monthlyCupLimit'); if (mCL) setMonthlyCupLimit(mCL);
      const storedDark = localStorage.getItem('boba_isDark');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (storedDark !== null) setIsDark(storedDark === 'true');
      
      const storedLang = localStorage.getItem('boba_prefLanguage');
       
      if (storedLang) setPrefLanguage(storedLang);
      
      const storedTemp = localStorage.getItem('boba_defaultTemp');
       
      if (storedTemp) setDefaultTemp(storedTemp);
      
      const storedSweet = localStorage.getItem('boba_defaultSweet');
       
      if (storedSweet) setDefaultSweet(storedSweet);

      const storedAccent = localStorage.getItem('boba_themeAccent');
      if (storedAccent) setThemeAccent(storedAccent);

      const storedFontScale = localStorage.getItem('boba_fontScale');
      if (storedFontScale === 'small' || storedFontScale === 'medium' || storedFontScale === 'large') {
        setFontScale(storedFontScale);
      }

      const storedDensity = localStorage.getItem('boba_cardDensity');
      if (storedDensity === 'compact' || storedDensity === 'comfortable') {
        setCardDensity(storedDensity);
      }
      const storedWeekStart = localStorage.getItem('boba_weekStart');
      if (storedWeekStart === 'sunday' || storedWeekStart === 'monday') {
        setWeekStart(storedWeekStart);
      }

      const storedCalendarImageMode = localStorage.getItem('boba_calendarImageMode');
      if (storedCalendarImageMode === 'brand' || storedCalendarImageMode === 'upload') {
        setCalendarImageMode(storedCalendarImageMode);
      }

      // 移除原有的 localStorage 同步读取逻辑
      // 改用 localforage 异步读取大容量的记录数据
      localforage.getItem('boba_records').then((storedRecords) => {
        if (storedRecords && Array.isArray(storedRecords)) {
          setRecords(storedRecords as DrinkRecord[]);
        }
      }).catch(err => {
        console.error("Failed to load records from localforage", err);
      }).finally(() => {
        // 等待异步数据加载完毕后，再解除 isLoaded 锁定，防止写入空数据
        setIsLoaded(true);
      });
      
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    // 使用 localforage 保存，不需要 JSON.stringify，它会自动处理对象和二进制！
    localforage.setItem('boba_records', records).catch(err => {
      console.error("Failed to save records to localforage", err);
    });
  }, [records, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('boba_isDark', isDark.toString());
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_prefLanguage', prefLanguage);
  }, [prefLanguage, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_defaultTemp', defaultTemp);
  }, [defaultTemp, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_defaultSweet', defaultSweet);
  }, [defaultSweet, isLoaded]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCalendarLogoTick(prev => prev + 1);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_themeAccent', themeAccent);
  }, [themeAccent, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_fontScale', fontScale);
    
    // 新增：动态修改 HTML 根元素的 font-size，全局驱动 Tailwind 的 rem
    const scaleMap = {
      small: '14.5px', // 偏小
      medium: '16px',  // 默认大小 (1rem = 16px)
      large: '17.5px'  // 偏大
    };
    document.documentElement.style.fontSize = scaleMap[fontScale] || '16px';
  }, [fontScale, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_cardDensity', cardDensity);
  }, [cardDensity, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_weekStart', weekStart);
  }, [weekStart, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_calendarImageMode', calendarImageMode);
  }, [calendarImageMode, isLoaded]);
  // 👉 监听并保存自律目标
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('boba_weeklyBudget', weeklyBudget);
    localStorage.setItem('boba_weeklyCupLimit', weeklyCupLimit);
    localStorage.setItem('boba_monthlyBudget', monthlyBudget);
    localStorage.setItem('boba_monthlyCupLimit', monthlyCupLimit);
  }, [weeklyBudget, weeklyCupLimit, monthlyBudget, monthlyCupLimit, isLoaded]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const settingMatches = (keywords: string[]) => {
    if (!settingsSearch.trim()) return true;
    const q = settingsSearch.toLowerCase();
    return keywords.some(k => k.toLowerCase().includes(q));
  };

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

  const handlePrevStatPeriod = () => {
    if (!currentDate) return;
    if (statPeriod === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
      return;
    }
    if (statPeriod === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      return;
    }
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()));
  };

  const handleNextStatPeriod = () => {
    if (!currentDate) return;
    if (statPeriod === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
      return;
    }
    if (statPeriod === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      return;
    }
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate()));
  };

  const openAddModal = () => {
    setEditingRecordId(null);
    setDraftImage('??');
    setDraftBrand('');
    setDraftName('');
    setDraftCost('');
    setDraftSize('中杯');
    setDraftTemperature(defaultTemp);
    setDraftSweetness(defaultSweet);
    triggerHaptic('light');
    
    // 👉 新增：初始化表单日期 (优先使用日历选中的日期，否则用今天)
    const y = currentDate ? currentDate.getFullYear() : new Date().getFullYear();
    const m = String((currentDate ? currentDate.getMonth() : new Date().getMonth()) + 1).padStart(2, '0');
    const d = String(selectedDay || (currentDate ? currentDate.getDate() : new Date().getDate())).padStart(2, '0');
    setDraftDate(`${y}-${m}-${d}`); // 格式必须是 YYYY-MM-DD
    
    setShowAddModal(true);
  };

  const openEditModal = (record: DrinkRecord) => {
    setEditingRecordId(record.id);
    setDraftImage(record.imageUrl);
    setDraftBrand(record.brand || '');
    setDraftName(record.type);
    setDraftCost(record.cost.toString());
    setDraftSize(record.size || '中杯');
    setDraftTemperature(record.temperature || '正常冰');
    setDraftSweetness(record.sweetness || '标准糖');
    
    // 👉 新增：初始化编辑时的历史日期
    const y = record.year;
    const m = String(record.month + 1).padStart(2, '0');
    const d = String(record.day).padStart(2, '0');
    setDraftDate(`${y}-${m}-${d}`);
    setShowAddModal(true);
  };

  // 1. 点击分享按钮时，不再直接发文字，而是打开单杯小票弹窗
  const handleShare = (record: DrinkRecord) => {
    setShareRecord(record);
  };

const handleSaveDrink = () => {
    if (!currentDate) return;
    
    // 👉 新增：解析表单里的日期
    if (!draftDate) {
  showToast("请选择有效日期", "error");
  return;
}
    const [dYear, dMonth, dDay] = draftDate.split('-').map(Number);
    
    const newRecord: DrinkRecord = {
      id: editingRecordId || Date.now().toString(),
      imageUrl: draftImage,
      day: dDay,
      month: dMonth - 1,
      year: dYear,
      cost: parseFloat(draftCost) || 0,
      brand: draftBrand,
      type: draftName || '今日奶茶',
      size: draftSize,
      temperature: draftTemperature,
      sweetness: draftSweetness,
    };
    
    if (editingRecordId) {
      setRecords(prev => prev.map(r => r.id === editingRecordId ? { ...newRecord } : r));
    } else {
      setRecords(prev => [...prev, newRecord]);
    }
    setShowAddModal(false);
  }; // ✨ 就是这里！之前少了这个闭合的括号，导致后面的函数全被吞了！

  // 将截图函数改为接收 targetRef 参数，实现复用 (👉 加回了 | null)
  const generateReceiptImageBlob = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    const receiptElement = targetRef.current;
    if (!receiptElement) return null;

    await waitForReceiptAssets(receiptElement);

    try {
      const blob = await htmlToImage.toBlob(receiptElement, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f8f8f8",
      });
      if (blob) return blob;
    } catch (error) {
      console.warn("Primary receipt renderer failed, retrying with fallback:", error);
    }

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(receiptElement, {
      backgroundColor: "#f8f8f8",
      logging: false,
      scale: 2,
      useCORS: true,
    });

    return new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), "image/png");
    });
  };
  
  // 通用保存功能 (👉 加回了 | null)
  const handleSaveReceipt = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    try {
      const blob = await generateReceiptImageBlob(targetRef);
      if (!blob) {
        showToast(prefLanguage === "English" ? "Receipt export failed" : "小票导出失败", 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naicha-receipt-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      showToast(prefLanguage === "English" ? "Receipt saved to gallery!" : "小票已保存到相册！", 'success');
    } catch (error) {
      console.error("Save receipt failed:", error);
      showToast(prefLanguage === "English" ? "Receipt export failed" : "小票导出失败", 'error');
    }
  };

  // 通用分享功能 (👉 加回了 | null)
  const handleShareReceipt = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
    try {
      const blob = await generateReceiptImageBlob(targetRef);
      if (!blob) {
        showToast(prefLanguage === "English" ? "Share failed" : "分享失败", 'error');
        return;
      }
      const file = new File([blob], `naicha-receipt-${Date.now()}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: prefLanguage === "English" ? "My Boba Receipt" : "我的奶茶小票",
          files: [file],
        });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naicha-receipt-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      showToast(prefLanguage === "English" ? "Device doesn't support share, downloaded instead." : "不支持分享，已自动为您下载该图片", 'info');
    } catch (error) {
      console.error("Share receipt failed:", error);
      showToast(prefLanguage === "English" ? "Share failed" : "分享失败", 'error');
    }
  };
  // 📸 核心：生成成就高光海报并唤起分享
  const handleShareAchievement = async () => {
    // 1. 定位到我们要截图的卡片节点
    const node = document.getElementById('achievement-card');
    if (!node || !selectedAchv) return;

    try {
      showToast(prefLanguage === 'English' ? 'Generating poster...' : '正在生成高光海报...', 'info');
      triggerHaptic('medium');

      // 2. 将 DOM 转为 Blob 图片（提高像素比以保证在手机上清晰）
      const blob = await htmlToImage.toBlob(node, {
        pixelRatio: 3, // 3倍清晰度，发朋友圈不模糊
        backgroundColor: isDark ? '#1a1a1e' : '#faf8f5', // 根据主题设置背景底色
      });

      if (!blob) throw new Error('Blob generation failed');

      // 3. 封装成文件对象
      const fileName = `老糖人成就-${selectedAchv.title}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 4. 优先尝试系统原生分享 (iOS/安卓可直接唤起微信/相册)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `我解锁了《老糖人》成就：${selectedAchv.title}`,
          text: selectedAchv.buildText(selectedAchv.trigger).comment,
        });
      } else {
        // 5. 降级方案：不支持原生分享时，直接下载图片到本地
        const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
        showToast(prefLanguage === 'English' ? 'Saved to gallery' : '已保存到相册，去分享吧！', 'success');
      }
    } catch (error) {
      console.error('Share failed:', error);
      showToast(prefLanguage === 'English' ? 'Generation failed' : '海报生成失败', 'error');
    }
  };

  // 导出数据 (将本地奶茶记录打包成 json 下载)
  const handleExportData = () => {
    triggerHaptic('medium');
    const dataStr = JSON.stringify(records);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SugarUltra_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(prefLanguage === 'English' ? 'Backup Exported!' : '备份数据导出成功！', 'success');
  };

  // 导入数据 (读取选中的 json 文件并覆盖当前记录)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          if (window.confirm(prefLanguage === 'English' ? 'Overwrite current data?' : '⚠️ 警告：这会覆盖当前所有的奶茶记录！\n\n确认导入吗？')) {
             setRecords(imported);
             triggerHaptic('heavy');
             showToast(prefLanguage === 'English' ? 'Data Restored!' : '✨ 数据恢复成功！', 'success');
          }
        } else {
           throw new Error("Invalid format");
        }
      } catch (err) {
        showToast(prefLanguage === 'English' ? 'Invalid File' : '文件格式错误，无法读取', 'error');
      }
      if (e.target) e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  // 🌟 一键压缩历史数据
  const handleCompressHistory = async () => {
    triggerHaptic('medium');
    showToast(prefLanguage === 'English' ? 'Compressing history, please wait...' : '正在压缩历史照片，请稍候...', 'info');
    
    let compressedCount = 0;
    
    // 遍历所有记录，寻找需要压缩的巨大照片
    const updatedRecords = await Promise.all(records.map(async (record) => {
      // 只有是以 data:image 开头，并且长度大于约 200KB 的字符串，才需要压缩
      if (record.imageUrl && record.imageUrl.startsWith('data:image/') && record.imageUrl.length > 200000) {
         try {
           const compressedUrl = await compressBase64Image(record.imageUrl);
           compressedCount++;
           return { ...record, imageUrl: compressedUrl };
         } catch (e) {
           return record; // 如果压缩失败，保留原图防止数据丢失
         }
      }
      return record;
    }));

    if (compressedCount > 0) {
      setRecords(updatedRecords);
      showToast(prefLanguage === 'English' ? `✨ Optimized ${compressedCount} photos!` : `✨ 成功压缩了 ${compressedCount} 张历史照片！`, 'success');
    } else {
      showToast(prefLanguage === 'English' ? 'All photos are already optimized!' : '历史照片已经是最佳体积，无需瘦身！', 'success');
    }
  };

  useEffect(() => {
    const today = new Date();
    // Using a specific date to match the screenshot vibe if requested, but current is better
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(today);
     
    setSelectedDay(today.getDate());
  }, []);

  useEffect(() => {
    // Only auto-update if it's NOT an uploaded image
    const isUploadedImage = draftImage.startsWith('blob:') || draftImage.startsWith('data:');
    if (!isUploadedImage) {
      const logoFile = getBrandLogoFile(draftBrand);
      
      if (logoFile) {
        const logoPath = `/logos/${logoFile}`;
        if (draftImage !== logoPath) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDraftImage(logoPath);
        }
      } else {
        // Fallback or leave as emoji if we couldn't match a sticker
        if (draftImage.length > 2 && !draftImage.startsWith('/logos/')) {
          setDraftImage('??');
        } else if (!getBrandKey(draftBrand) && !draftImage.startsWith('/logos/')) {
          setDraftImage('??');
        }
      }
    }
    
    // Auto-update sweetness if the current one doesn't match the brand's options
    const options = getSweetnessOptions(draftBrand);
    if (!options.includes(draftSweetness) && draftBrand.length > 0) {
       
      setDraftSweetness(options[options.length - 1]); // Default to the last one (usually standard)
    }
  }, [draftBrand, draftImage, draftSweetness]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentDate) return;

    try {
      const imageUrl = await compressImage(file);
      setDraftImage(imageUrl);
      setShowAddModal(true);
    } catch (error) {
      console.error("Image capture failed:", error);
      setShowAddModal(true);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Avoid hydration mismatch by waiting for mount
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

  // 🌟 核心逻辑：如果设置为周一开头，对齐头部和月首空格
  if (weekStart === 'monday') {
    weekDays = ['一', '二', '三', '四', '五', '六', '日'];
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
  const weekDaysFull = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
// 🧠 意志力与打卡计算引擎 (逻辑修正：只要连胜未断，优先显示打卡)
  const disciplineStats = (() => {
    if (records.length === 0) return { streak: 0, sober: 0, type: 'none', comment: "开启你的第一杯吧！" };

    const toDateStr = (y: number, m: number, d: number) => 
      `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const uniqueDays = Array.from(new Set(records.map(r => toDateStr(r.year, r.month, r.day))))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const now = new Date();
    const todayClean = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    
    const yesterday = new Date(todayClean);
    yesterday.setDate(todayClean.getDate() - 1);
    const yesterdayStr = toDateStr(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    const drankToday = uniqueDays[0] === todayStr;
    const drankYesterday = uniqueDays.includes(yesterdayStr);

    // 1. 计算连续打卡 (Streak)
    let streak = 0;
    if (drankToday || drankYesterday) {
      let checkDate = new Date(drankToday ? todayClean : yesterday);
      while (true) {
        const checkStr = toDateStr(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        if (uniqueDays.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 2. 计算戒断天数 (Sober)
    let soberDays = 0;
    if (!drankToday) {
      const lastDateParts = uniqueDays[0].split('-');
      const lastDate = new Date(Number(lastDateParts[0]), Number(lastDateParts[1]) - 1, Number(lastDateParts[2]));
      const diffTime = Math.max(0, todayClean.getTime() - lastDate.getTime());
      soberDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // 3. 决定显示类型：只要打卡未中断(今天或昨天喝过)，优先显示打卡
    const showStreak = drankToday || (drankYesterday && streak > 0);
    const displayType = showStreak ? 'streak' : 'sober';

    // 4. 毒舌文案引擎
    let comment = "";
    if (showStreak) {
      if (streak >= 7) comment = "勋章建议直接焊在脑门上。胰岛：‘求求了，歇一天吧’。";
      else comment = "你的血管里现在流的不是血，是糖浆。";
    } else {
      if (soberDays >= 7) comment = "不得了！你居然扛过了 7 天。你现在呼吸的空气是不是都变甜了？";
      else comment = "三分钟热度？别急，隔壁的优惠券正在向你招手。";
    }

    return { streak, sober: soberDays, type: displayType, comment };
  })();
  // Stats Calculations
  const currentMonthRecords = records.filter(r => r.month === currentMonth && r.year === currentYear);
  const activeDay = selectedDay || currentDay;
  const sortedMonthRecords = [...currentMonthRecords].sort((a, b) => {
   if (b.day !== a.day) return b.day - a.day; 
    const aTime = Number.parseInt(a.id, 10);
    const bTime = Number.parseInt(b.id, 10);
    return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
  });
  const visibleRecords = sortedMonthRecords;
  const totalCups = currentMonthRecords.length;
  const totalCost = currentMonthRecords.reduce((sum, r) => sum + r.cost, 0);
  const avgCost = currentDay > 0 ? (totalCost / currentDay).toFixed(1) : "0.0";

// Stats Period Calculations
  const dayOfW = currentDate.getDay(); // 0(周日) - 6(周六)
  let daysToSubtractForWeek = dayOfW; // 默认按周日开头计算偏移
  if (weekStart === 'monday') {
    daysToSubtractForWeek = dayOfW === 0 ? 6 : dayOfW - 1; // 周一开头计算偏移
  }
  const startOfWeek = new Date(currentYear, currentMonth, currentDay - daysToSubtractForWeek);
  const endOfWeek = new Date(currentYear, currentMonth, currentDay - daysToSubtractForWeek + 6);

  let statRecords: DrinkRecord[] = [];
  let statDateLabel = "";
  
  let chartTitle = "";
  let chartLabels: string[] = [];
  let chartValues: number[] = [];

  if (statPeriod === 'week') {
    statRecords = records.filter(r => {
      const d = new Date(r.year, r.month, r.day);
      return d >= startOfWeek && d <= endOfWeek;
    });
    statDateLabel = `${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

    chartTitle = '每日杯数';
    chartLabels = weekStart === 'monday' 
        ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] 
        : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    chartValues = [0, 0, 0, 0, 0, 0, 0];
    
    statRecords.forEach(r => {
      const d = new Date(r.year, r.month, r.day);
      let dayIdx = d.getDay(); // 默认 0(日)-6(六)
      if (weekStart === 'monday') {
         dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      }
      chartValues[dayIdx]++;
    });
  } else if (statPeriod === 'month') {
    statRecords = currentMonthRecords;
    statDateLabel = `${currentYear}年${currentMonth + 1}月`;

    chartTitle = '每周杯数';
    chartLabels = ['第一周', '第二周', '第三周', '第四周', '第五周'];
    chartValues = [0, 0, 0, 0, 0];
    
    statRecords.forEach(r => {
      const weekIdx = Math.min(Math.floor((r.day - 1) / 7), 4);
      chartValues[weekIdx]++;
    });
  } else {
    statRecords = records.filter(r => r.year === currentYear);
    statDateLabel = `${currentYear}年`;

    chartTitle = '每月杯数';
    chartLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    chartValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    statRecords.forEach(r => {
      chartValues[r.month]++;
    });
  }

  const statCups = statRecords.length;
  const statCost = statRecords.reduce((sum, r) => sum + r.cost, 0);
  const maxChartVal = Math.max(...chartValues, 1);
  const unlabeledBrandName = prefLanguage === 'English' ? 'Unlabeled' : '未标记品牌';
  const otherBrandName = prefLanguage === 'English' ? 'Others' : '其他';
  // 1. 常见品牌的专属品牌色（不仅能防撞色，还能让图表极其直观）
 // 1. 高级奶油/莫兰迪色系（降低饱和度，统一质感，告别辣眼睛的红蓝大乱炖）
  const specificBrandColors: Record<string, string> = {
    "瑞幸": "#7291B3",       // 海盐雾霾蓝 (代替原本刺眼的深蓝)
    "库迪咖啡": "#CB8282",   // 玫瑰豆沙粉
    "霸王茶姬": "#B5736E",   // 乌龙红茶色
    "茶百道": "#83A9D1",     // 清新天空蓝
    "蜜雪冰城": "#E28383",   // 冰糖草莓柔红
    "喜茶": "#A1A5A9",       // 芝士质感灰白
    "奈雪": "#82A485",       // 幽兰抹茶绿
    "古茗": "#D69670",       // 泰式奶茶橙
    "茶话弄": "#8AB6AD",     // 青花瓷釉蓝绿
    "茉莉奶白": "#A3C6A8",   // 茉莉白兰青
    "一点点": "#769676",     // 经典绿茶青
    "眷茶": "#D4AE75",       // 桂花酒酿暖黄
    "幸运咖": "#AD6969",     // 深度烘焙红棕
    "沪上阿姨": "#9A95C2",   // 鲜熬芋泥紫
    "CoCo": "#DCA562",       // 芒果百香柔橙
    "书亦烧仙草": "#A68679", // 仙草奶咖色
    "爷爷不泡茶": "#7B99B5", // 东方青灰色
    "益禾堂": "#8DAB7B",     // 烤奶青茶色
    "柠季": "#B2C471",       // 暴打鲜柠绿
    "未标记品牌": "#C2C2C2", // 质感浅灰
    "其他": "#D6D6D6"        // 柔和奶灰
  };

  // 2. 备选高颜值调色板（给没有专属颜色的小众品牌使用，保证闭眼抽出来的颜色也好看）
  const fallbackPalette = [
    '#E0A5A6', // 柔桃
    '#A0B8D1', // 雾蓝
    '#A0C4A0', // 抹茶
    '#E2C180', // 奶黄
    '#B29FD6', // 芋香
    '#D2AA8F', // 奶咖
    '#8BB8B8', // 海盐
    '#DCA38D'  // 珊瑚
  ];

  const getBrandColor = (brand: string) => {
    // 如果有专属颜色，直接使用专属颜色
    if (specificBrandColors[brand]) {
      return specificBrandColors[brand];
    }
    // 否则使用 Hash 算法从高对比度备选库中挑选
    const hash = Array.from(brand).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return fallbackPalette[hash % fallbackPalette.length];
  };
  const brandMetricMap = statRecords.reduce((acc, record) => {
    const name = record.brand?.trim() ? record.brand.trim() : unlabeledBrandName;
    if (!acc[name]) {
      acc[name] = { cups: 0, cost: 0 };
    }
    acc[name].cups += 1;
    acc[name].cost += Number(record.cost) || 0;
    return acc;
  }, {} as Record<string, { cups: number; cost: number }>);
  const brandMetricKey = brandDonutMode === 'cups' ? 'cups' : 'cost';
  const allBrandMetrics = Object.entries(brandMetricMap)
    .map(([brand, metric]) => ({ brand, cups: metric.cups, cost: metric.cost }))
    .sort((a, b) => {
      const delta = b[brandMetricKey] - a[brandMetricKey];
      if (delta !== 0) return delta;
      return b.cups - a.cups;
    });
  const topBrandMetrics = allBrandMetrics.slice(0, 5);
  const otherBrandMetrics = allBrandMetrics.slice(5);
  const mergedBrandMetrics = otherBrandMetrics.length > 0
    ? [
        ...topBrandMetrics,
        {
          brand: otherBrandName,
          cups: otherBrandMetrics.reduce((sum, item) => sum + item.cups, 0),
          cost: otherBrandMetrics.reduce((sum, item) => sum + item.cost, 0),
        },
      ]
    : topBrandMetrics;
  const donutTotal = mergedBrandMetrics.reduce((sum, item) => sum + item[brandMetricKey], 0);
  const brandDonutItems = mergedBrandMetrics.map((item): BrandMetricItem => ({
    ...item,
    ratio: donutTotal > 0 ? item[brandMetricKey] / donutTotal : 0,
  }));
  let donutProgress = 0;
  const donutGradient = brandDonutItems
    .map(item => {
      const start = donutProgress * 100;
      donutProgress += item.ratio;
      const end = donutProgress * 100;
      const color = getBrandColor(item.brand);
      return `${color} ${start}% ${end}%`;
    })
    .join(', ');

  const getMostFrequent = (arr: any[]) => {
    if (arr.length === 0) return prefLanguage === 'English' ? 'None' : '无';
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const receiptTopBrand = getMostFrequent(statRecords.map(r => r.brand).filter(b => b));
  const receiptTopTemp = getMostFrequent(statRecords.map(r => r.temperature).filter(t => t));
  const receiptTopSweet = getMostFrequent(statRecords.map(r => r.sweetness).filter(s => s));
  
  // 动态获取不同周期的印章称号
  const getReceiptTitle = (cups: number, period: string, lang: string) => {
    if (cups === 0) return lang === 'English' ? "Sugar Min" : "戒糖中";

    // 设置不同统计周期的杯数阈值 [阶段1, 阶段2, 阶段3]
    let limits = [5, 10, 15]; // 默认：月度统计
    if (period === 'week') limits = [1, 3, 5];     // 周度统计
    if (period === 'year') limits = [20, 60, 100]; // 年度统计

    if (cups <= limits[0]) return lang === 'English' ? "Sugar Pro" : "清糖佛子";
    if (cups <= limits[1]) return lang === 'English' ? "Sugar Promax" : "奶茶土匪";
    if (cups <= limits[2]) return lang === 'English' ? "Sugar ProMax+" : "老喝家";
    return lang === 'English' ? "Sugar Ultra" : "老糖人";
  };

  // 👉 动态计算当前视图下的目标限制
  const currentCupLimit = statPeriod === 'week' ? (parseInt(weeklyCupLimit) || 0) : statPeriod === 'month' ? (parseInt(monthlyCupLimit) || 0) : 0;
  const currentBudget = statPeriod === 'week' ? (parseFloat(weeklyBudget) || 0) : statPeriod === 'month' ? (parseFloat(monthlyBudget) || 0) : 0;
  
  // 👉 渲染进度条的辅助函数
  const renderDisciplineBar = (current: number, target: number, isMoney: boolean) => {
    if (target <= 0 || statPeriod === 'year') return null; // 未设置目标或处于年度视图时隐藏
    
    const percent = (current / target) * 100;
    const isWarning = percent >= 80 && percent < 100;
    const isDanger = percent >= 100;
    
    const remaining = target - current;
    let statusText = "";
    if (isDanger) {
      statusText = isMoney ? `超标 ￥${Math.abs(remaining).toFixed(1)} ` : `超标 ${Math.abs(remaining)} 杯 `;
    } else if (isWarning) {
      statusText = isMoney ? `仅剩 ￥${remaining.toFixed(1)} ` : `仅剩 ${remaining} 杯 `;
    } else {
      statusText = isMoney ? `剩余预算 ￥${remaining.toFixed(1)}` : `剩余额度 ${remaining} 杯`;
    }

    const textColor = isDanger ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-text-muted';
    const barColor = isDanger ? '#EF4444' : isWarning ? '#F97316' : themeAccent;

    return (
      <div className="mt-3 w-full">
        <div className="h-1.5 w-full bg-bg-input rounded-full overflow-hidden mb-1.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
          />
        </div>
        <div className={`text-[10px] font-bold ${textColor}`}>{statusText}</div>
      </div>
    );
  };

  return (
    // 👇 核心修复 1：将 min-h 换成固定的 h，并加上 overflow-hidden，彻底锁死外层页面不许动！
    <div className="w-full h-[100dvh] overflow-hidden bg-bg-app flex flex-col font-sans text-text-main sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main sm:shadow-2xl relative">
      
      {/* Dynamic Content Based on Tab */}
      {/* 👇 核心重构 1：外层容器在首页时不滚动，交由内部列表独立滚动！ */}
      <div className={`flex-1 w-full relative ${activeTab === 'home' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto pb-36 custom-scrollbar scroll-smooth'}`}>
        
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full w-full">
            
{/* 📌 核心重构 2：优雅收缩，保留圆润美感，拒绝廉价压缩 */}
            {/* 优化 1：顶部 pt-12 改为 pt-8，底部 pb-5 改为 pb-4，收紧无意义的边缘留白 */}
            <div className="flex-none bg-bg-app px-5 pt-8 pb-4 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-b border-border-main/40 z-20 relative">
              
{/* Header (精致排版) */}
              <div className="mb-4 relative w-full">
                {/* 👇 修复 1：将 top-1 改为 top-0，让右上角的按钮组微微上移 4px */}
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
                      
                      {/* 👇 修复 2：将 mt-1.5 加大为 mt-3，把下方的日期和勋章行往下推 6px，彻底避开上方按钮！ */}
                      <div className="flex justify-between items-center w-full mt-3 gap-2">
                        <p className="text-text-muted text-[13px] font-medium tracking-wide truncate flex-1 min-w-0">
                          {currentMonth + 1}月{currentDay}日 {weekDaysFull[currentDayOfWeek]}
                        </p>
                        {disciplineStats && (
                          <div onClick={() => showToast(disciplineStats.comment, 'info')} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-input/60 backdrop-blur-md border border-border-main/40 text-[10px] font-bold cursor-pointer active:scale-95 transition-all shadow-sm shrink-0 whitespace-nowrap">
                            {disciplineStats.type === 'streak' ? (<><Flame size={11} className="text-orange-500 fill-orange-500 shrink-0" /> <span className="text-orange-600">连续打卡 {disciplineStats.streak} 天</span></>) : (<><Trophy size={11} className="text-green-500 shrink-0" /> <span className="text-green-600">连续戒糖 {disciplineStats.sober} 天</span></>)}
                            <span className="text-text-muted opacity-40 ml-0.5">| 吐槽</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Calendar Card */}
              {/* 优化 4：圆角 32px 收紧至 28px，内边距 p-5 改为 p-4 px-5（上下窄左右宽），底部间距 mb-6 改为 mb-4 */}
              <div className="bg-bg-card rounded-[28px] p-4 px-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] mb-4 overflow-hidden border border-border-main/30">
                <div className="grid grid-cols-7 gap-x-2 mb-2">
                  {weekDays.map(d => (<div key={d} className="text-center text-[11px] text-text-muted font-bold">{d}</div>))}
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  {/* 优化 5：日历格子上下间距从 gap-y-3 微微收紧至 gap-y-2 */}
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
                            e.preventDefault();
                            setSelectedDay(day);
                            setTimeout(() => {
                              const container = scrollContainerRef.current;
                              const target = document.getElementById(`record-date-${day}`);
                              if (container && target) {
                                container.scrollTo({ top: target.offsetTop - 15, behavior: 'smooth' });
                                triggerHaptic('medium');
                              } else {
                                triggerHaptic('light'); 
                              }
                            }, 100);
                          }}
                          className={`aspect-square flex items-center justify-center rounded-[14px] text-sm font-medium relative overflow-hidden transition-colors cursor-pointer ${isSelected ? 'bg-[#8E7558] text-white shadow-md ring-2 ring-[#8E7558]' : (!firstRecord ? 'bg-bg-input text-text-main hover:bg-border-main' : 'bg-border-main')}`}
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

              {/* Add Button */}
              {/* 优化 6：放弃过于粗大的 py-4，使用 iOS 规范里顶级按钮的标准高度 h-[52px]，加深渐变色提升品质感 */}
              <button onClick={openAddModal} className="w-full bg-gradient-to-r from-[#8E7558] to-[#A58E72] text-white h-[52px] rounded-full text-[16px] font-bold shadow-[0_6px_16px_rgba(142,117,88,0.25)] flex justify-center items-center gap-2 active:scale-95 transition-transform">
                <Plus size={20} strokeWidth={3} />
                添加一杯
              </button>
            </div> {/* 👆 上半部（日历区域）到此完美闭合 */}

            {/* 📜 核心重构 3：下半区 (奶茶列表) 被赋予了独立的滚动条！ */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-36 custom-scrollbar relative">
              <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                <span>{`${currentMonth + 1}月奶茶`}</span>
                <span className="text-sm font-medium text-text-muted">{visibleRecords.length} 杯</span>
              </h2>
              {/* 根据卡片密度动态调整每组卡片之间的上下间距 */}
              <div className={cardDensity === "compact" ? "space-y-2.5" : "space-y-4"}>
                {visibleRecords.length === 0 ? (
                  <div className="bg-bg-card rounded-[24px] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <p className="text-text-muted text-sm font-medium">本月还没有喝奶茶</p>
                  </div>
                ) : (
                  visibleRecords.map((record, index) => {
                    const recordDateString = `${record.month + 1}月${record.day}日`;  
                    // 核心逻辑：如果是第一条记录，或者当前记录的日期和上一条记录的日期不同，才显示日期标题
                    const showDateHeader = index === 0 || visibleRecords[index - 1].day !== record.day;
                    return (
                      // 如果不显示日期标题，我们可以稍微减少一点同一天卡片之间的间距（比如去掉 margin-top）让它们看起来更像一组
             <div key={record.id} className={`space-y-2 ${showDateHeader ? 'mt-2' : '-mt-1'}`}>
                      {showDateHeader && (
                        <div 
                          id={`record-date-${record.day}`} 
                          // 👇 删除了之前为了防遮挡写的 scroll-mt-[420px]，恢复正常间距
                          className="text-lg font-black tracking-tight text-text-main ml-1 mt-4 mb-2"
                        >
                          {recordDateString}
                        </div>
                      )}
      
      <div className="relative overflow-hidden rounded-[24px]">
                          {/* Background Actions */}
                          <div className="absolute inset-0 bg-bg-input flex justify-end items-center px-4 gap-3">
                            <button 
                              onClick={() => openEditModal(record)}
                              className="w-12 h-12 rounded-full bg-[#3B82F6] text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleShare(record)}
                              className="w-12 h-12 rounded-full bg-border-main text-text-main flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                            >
                              <Share size={18} />
                            </button>
                            <button 
                              onClick={() => setRecords(prev => prev.filter(r => r.id !== record.id))}
                              className="w-12 h-12 rounded-full bg-[#EF4444] text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          {/* Foreground Card */}
                          <motion.div 
                          drag="x"
                          dragConstraints={{ left: -200, right: 0 }}
                          dragElastic={0.1}
                          // 根据卡片密度动态调整卡片内部的 Padding (p-3 vs p-4) 和元素间隔 (gap-3 vs gap-4)
                          className={`bg-bg-card flex items-center relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${
                            cardDensity === "compact" ? "p-3 gap-3" : "p-4 gap-4"
                          }`}
                          >
                            <div className="w-14 h-16 flex-shrink-0 flex items-center justify-center">
                              {isExportableImageSrc(record.imageUrl) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={record.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-sm scale-110" />
                              ) : (
                                <Coffee size={44} className="text-text-muted" strokeWidth={1.8} />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex flex-col mb-1">
                                {/* 👉 将品牌标签和冷热图标放在同一个横向容器中 */}
                                <div className="flex items-center gap-1.5 mb-1">
                                  {record.brand && (
                                    <span className="text-[11px] bg-border-main px-2 py-0.5 rounded-full text-text-muted font-bold">
                                      {record.brand}
                                    </span>
                                  )}
                                  {/* 使用 Emoji 替代 SVG 图标，质感更好 */}
                                  {record.temperature && record.temperature.includes('冰') ? (
                                    <span className="text-[14px] leading-none drop-shadow-sm">🧊</span>
                                  ) : record.temperature === '热' ? (
                                    <span className="text-[14px] leading-none drop-shadow-sm text-red-500">♨️</span> 
                                  ) : null}
                                </div>
                                
                                {/* 饮品名称独立清爽显示 */}
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-text-main text-base leading-tight">{record.type}</span>
                                </div>
                              </div>
                              <div className="text-xs text-text-muted font-medium flex items-center gap-1.5 mt-1">
                                <span>{record.size || '中杯'}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end justify-center h-full gap-1">
                              <span className="font-bold text-[#8E7558] text-lg">￥{record.cost}</span>
                              <span className="flex items-center gap-1 text-[10px] bg-bg-input px-2 py-0.5 rounded text-text-muted font-medium">
                                <span>{record.sweetness || '标准糖'}</span>
                                <span>/</span>
                                <span>{record.temperature || '正常冰'}</span>
                              </span>
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

        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-12">
            
            {/* Header with Month Switcher */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-4xl font-bold tracking-tight text-text-main">
                {prefLanguage === 'English' ? 'Stats' : '统计'}
              </h1>
              
              <div className="flex items-center bg-bg-input/60 rounded-full py-1.5 px-1 shadow-sm border border-border-main/50 text-text-muted transition-colors">
                <button onClick={handlePrevStatPeriod} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <div className="px-2 text-xs font-semibold tracking-wide min-w-[70px] text-center text-text-main whitespace-nowrap">
                  {statDateLabel}
                </div>
                <button onClick={handleNextStatPeriod} className="p-1 px-1.5 hover:text-text-main rounded-full transition-colors active:scale-95">
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Time Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setStatPeriod('week'); setStatAnimationKey(prev => prev + 1); }} 
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'week' ? 'bg-[#D2B48C] text-[#3E2723]' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}
              >
                {prefLanguage === 'English' ? 'W' : '周'}
              </button>
              <button
                onClick={() => { setStatPeriod('month'); setStatAnimationKey(prev => prev + 1); }} 
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'month' ? 'bg-[#D2B48C] text-[#3E2723]' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}
              >
                {prefLanguage === 'English' ? 'M' : '月'}
              </button>
              <button
                onClick={() => { setStatPeriod('year'); setStatAnimationKey(prev => prev + 1); }} 
                className={`px-5 py-2 rounded-full font-bold text-sm transition-colors ${statPeriod === 'year' ? 'bg-[#D2B48C] text-[#3E2723]' : 'bg-bg-card hover:bg-bg-input text-text-muted border border-border-main/50'}`}
              >
                {prefLanguage === 'English' ? 'Y' : '年'}
              </button>
              <div className="flex-1"></div>
              
              {/* 👇 新增：生成炫酷海报的按钮 */}
              {statCups > 0 && (
                <button
                  onClick={() => setShowPosterModal(true)}
                  className="px-3 h-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all"
                >
                  {prefLanguage === 'English' ? '✨ Wrapped' : '✨ 回忆'}
                </button>
              )}
              <button
                onClick={() => {
                  setShowReceiptModal(true);
                }}
                className="w-9 h-9 rounded-full bg-bg-card border border-border-main/50 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-bg-input transition-colors"
                title={prefLanguage === 'English' ? 'Share Receipt' : '分享账单'}
              >
                <Share size={16} />
              </button>
            </div>

 {/* Visual Shelf */}
            {(() => {
              // 1. 动态计算贴纸缩放比例 (完全保留原始设定)
              let stickerScale = 1;
              const count = statRecords.length;
              if (count > 80) stickerScale = 0.28      // 超过80杯：超级迷你
              else if (count > 40) stickerScale = 0.4; // 40-80杯：极小
              else if (count > 20) stickerScale = 0.45;  // 20-40杯：半等比
              else if (count > 10) stickerScale = 0.65;  // 10-20杯：微缩
              else if (count > 5) stickerScale = 0.8;  // 5-10杯：稍小

              // 2. 基础尺寸 (约等于原本的 w-16 h-20)
              const baseWidth = 64;
              const baseHeight = 80;
              const baseOverlap = -10; // 基础的相互重叠量 (保留原始粘连感)

              return (
                <div className="bg-bg-card rounded-[32px] h-64 w-full relative mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-border-main overflow-hidden flex items-end justify-center pb-2 px-4">
                  {/* 放宽容器限制，让贴纸更容易堆叠 */}
                  <div className="flex flex-wrap-reverse justify-center max-w-[95%]">
                    {statRecords.map((r, i) => {
                      // 🚀 核心性能优化 1/2：当杯数极大时，开启 CPU 降级保护
                      const isMassive = count > 40;

                      return (
                      <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        // 🚀 核心性能优化 2/2：数量少时保留 Q 弹的 spring；数量大时降级为不占 CPU 的 tween 平滑过渡
                        transition={{ 
                           delay: isMassive ? Math.random() * 0.3 : i * Math.min(0.05, 0.95 / Math.max(count, 1)), 
                           type: isMassive ? 'tween' : 'spring', 
                           duration: isMassive ? 0.3 : undefined,
                           bounce: isMassive ? 0 : 0.5 
                        }}
                        key={`${r.id}-${statAnimationKey}`}
                        // 🌟 增加 hover:z-50 放大浮现效果，并加上 will-change-transform 开启 GPU 硬件加速
                        className="transform hover:!scale-125 hover:z-50 transition-all cursor-pointer relative will-change-transform"
                        style={{ 
                          width: `${baseWidth * stickerScale}px`,
                          height: `${baseHeight * stickerScale}px`,
                          marginLeft: i === 0 ? '0px' : `${baseOverlap * stickerScale}px`, // 完全保留原始边距
                          rotate: `${(i % 3 === 0 ? -1 : 1) * ((i % 10) * 2)}deg`, // 完全保留原始旋转
                          zIndex: i
                        }}
                      >
                        {isExportableImageSrc(r.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={r.imageUrl} 
                            alt="drink" 
                            className="w-full h-full object-contain" 
                            // 🌟 完全保留原始的 5 层重叠厚实白边滤镜
                            style={{ filter: "drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-text-muted"
                            style={{ filter: "drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
                          >
                            {/* 默认的图标也跟着一起等比例缩小 */}
                            <Coffee size={38 * stickerScale} strokeWidth={1.8} />
                          </div>
                        )}
                      </motion.div>
                    )})}
                  </div>
                  
                  {statRecords.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
                      {prefLanguage === 'English' ? 'No tastings in this period yet' : '这段时间还没有品鉴'}
                    </div>
                  )}
                </div>
              );
            })()}
{/* 🌟 方案B：年度专属奶茶热力图 (GitHub Style) */}
            {statPeriod === 'year' && (() => {
              // 1. 数据聚合：计算今年每一天的杯数
              const yearRecordsMap = new Map();
              statRecords.forEach(r => {
                  const dateStr = `${r.year}-${r.month}-${r.day}`;
                  yearRecordsMap.set(dateStr, (yearRecordsMap.get(dateStr) || 0) + 1);
              });

              const startDate = new Date(currentYear, 0, 1);
              const endDate = new Date(currentYear, 11, 31);
              const heatmapDays = [];
              
              // 2. 对齐星期：填充年初的空白格子，确保排版正确
              let startDayOfWeek = startDate.getDay();
              if (weekStart === 'monday') {
                  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
              }
              for(let i = 0; i < startDayOfWeek; i++) {
                  heatmapDays.push(null); 
              }

              let maxStreak = 0;
              let currentStreak = 0;

              // 3. 生成 365 天的数据集
              for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                  const m = d.getMonth();
                  const day = d.getDate();
                  const dateStr = `${currentYear}-${m}-${day}`;
                  const count = yearRecordsMap.get(dateStr) || 0;
                  
                  heatmapDays.push({ month: m, day: day, count, dateStr });

                  // 计算高热预警 (连续多少天有喝奶茶)
                  if (count > 0) {
                      currentStreak++;
                      if (currentStreak > maxStreak) maxStreak = currentStreak;
                  } else {
                      currentStreak = 0;
                  }
              }

              // 4. 计算月份坐标轴
              const monthLabels: {month: number, col: number}[] = [];
              let colIndex = 0;
              heatmapDays.forEach((item, index) => {
                  if (index % 7 === 0) colIndex++;
                  if (item && item.day === 1) monthLabels.push({ month: item.month + 1, col: colIndex });
              });

              return (
                  <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-4 w-full">
                      {/* 标题栏与彩蛋 */}
                      <div className="flex justify-between items-center mb-3">
                          <div>
                              <span className="text-base text-text-main font-bold block">{currentYear} 年度热力图</span>
                              <span className="text-[11px] text-text-muted font-medium">一眼看穿你的糖分摄入密度</span>
                          </div>
                          {maxStreak >= 5 && (
                              <div 
                                 onClick={() => {
                                     triggerHaptic('medium');
                                     showToast(`经检测，今年你曾连续 ${maxStreak} 天重度堕落，当时是发财了吗？`, 'info');
                                 }}
                                 className="flex items-center gap-1 bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer hover:bg-orange-500/20 active:scale-95 transition-all"
                              >
                                  <Flame size={12} className="fill-orange-500"/>
                                  高热预警
                              </div>
                          )}
                      </div>

                      {/* 滑动矩阵区 */}
                      <div className="w-full overflow-x-auto custom-scrollbar pb-3 pt-1 -mx-2 px-2">
                          {/* 月份坐标轴 */}
                          <div className="flex text-[9px] text-text-muted font-bold mb-1.5 relative h-3" style={{ width: `${Math.ceil(heatmapDays.length / 7) * 14}px` }}>
                              {monthLabels.map((lbl, i) => (
                                  <div key={i} className="absolute top-0 transform -translate-x-1" style={{ left: `${(lbl.col - 1) * 14}px` }}>
                                      {lbl.month}月
                                  </div>
                              ))}
                          </div>

                          {/* GitHub 风格格子矩阵 */}
                          <div className="grid grid-rows-7 grid-flow-col gap-[4px] min-w-max">
                              {heatmapDays.map((item, index) => {
                                  if (!item) return <div key={`empty-${index}`} className="w-[10px] h-[10px] rounded-[2px]"></div>;
                                  
                                // 🚨 亮眼色阶计算：高能预警配色
                                  let bgColor = 'bg-bg-input/50'; // 0杯：原本的浅灰色（健康）
                                  let shadowClass = ''; // 给致死量加个小发光特效

                                  if (item.count === 1) {
                                      bgColor = 'bg-amber-400'; // 1杯：亮琥珀色 (醒目)
                                  } else if (item.count === 2) {
                                      bgColor = 'bg-orange-500'; // 2杯：活力亮橙 (警告)
                                  } else if (item.count >= 3) {
                                      bgColor = 'bg-red-500'; // 3杯+：刺眼猩红 (致死量)
                                      shadowClass = 'shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10 relative'; // 致死量格子自带红色发光
                                  }

                                  return (
                                      <div 
                                          key={item.dateStr} 
                                          onClick={() => {
                                              triggerHaptic('light');
                                              if (item.count === 0) {
                                                  showToast(`${item.month + 1}月${item.day}日 · 胰岛很安全，0 杯`, 'info');
                                              } else {
                                                  showToast(`${item.month + 1}月${item.day}日 · 喝了 ${item.count} 杯，血液纯度已降至糖点。`, 'info');
                                              }
                                          }}
                                          // 移除了 opacity，直接使用高饱和颜色，并加上阴影特效
                                          className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer hover:ring-2 ring-border-main hover:scale-125 transition-all duration-200 ${bgColor} ${shadowClass}`}
                                      ></div>
                                  );
                              })}
                          </div>
                      </div>

                      {/* 👇 底部图例也要同步更换颜色 */}
                      <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] text-text-muted font-bold">
                          <span>健康</span>
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-bg-input/50"></div>
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-amber-400"></div>
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-orange-500"></div>
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
                          <span className="text-red-500">致“死”量</span>
                      </div>
                  </div>
              );
            })()}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                
                <div>
                  <span className="text-xs text-text-muted font-medium block mb-2">总杯数</span>
                  <div className={`text-4xl font-black font-mono tracking-tight ${currentCupLimit > 0 && statCups >= currentCupLimit && statPeriod !== 'year' ? 'text-red-500' : ''}`} style={currentCupLimit > 0 && statCups >= currentCupLimit && statPeriod !== 'year' ? {} : { color: themeAccent }}>{statCups}</div>
                </div>
                {renderDisciplineBar(statCups, currentCupLimit, false)}
              </div>
              <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <span className="text-xs text-text-muted font-medium block mb-2">总花费</span>
                  <div className={`text-4xl font-black font-mono tracking-tight ${currentBudget > 0 && statCost >= currentBudget && statPeriod !== 'year' ? 'text-red-500' : ''}`} style={currentBudget > 0 && statCost >= currentBudget && statPeriod !== 'year' ? {} : { color: themeAccent }}>{parseFloat(statCost.toFixed(2))}</div>
                </div>
                {renderDisciplineBar(statCost, currentBudget, true)}
              </div>

              <div className="bg-bg-card rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base text-text-main font-bold">{prefLanguage === 'English' ? 'Brand Mix' : '品牌占比'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBrandDonutMode('cups')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${brandDonutMode === 'cups' ? 'bg-[#D2B48C] text-[#3E2723]' : 'bg-bg-input text-text-muted'}`}
                    >
                      {prefLanguage === 'English' ? 'Cups' : '杯数'}
                    </button>
                    <button
                      onClick={() => setBrandDonutMode('cost')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${brandDonutMode === 'cost' ? 'bg-[#D2B48C] text-[#3E2723]' : 'bg-bg-input text-text-muted'}`}
                    >
                      {prefLanguage === 'English' ? 'Cost' : '花费'}
                    </button>
                  </div>
                </div>

                {brandDonutItems.length > 0 && donutTotal > 0 ? (
                  <div className="flex gap-4 items-center">
                    <div className="relative w-[124px] h-[124px] shrink-0">
                      <div
                        className="w-full h-full rounded-full"
                        style={{ background: `conic-gradient(${donutGradient})` }}
                      />
                      <div className="absolute inset-[14px] rounded-full bg-bg-card flex flex-col items-center justify-center">
                        <span className="text-[10px] text-text-muted font-medium">
                          {brandDonutMode === 'cups' ? (prefLanguage === 'English' ? 'Total Cups' : '总杯数') : (prefLanguage === 'English' ? 'Total Cost' : '总花费')}
                        </span>
                        <span className="text-lg font-black text-[#8E7558] leading-tight">
                          {brandDonutMode === 'cups'
                            ? `${Math.round(donutTotal)}${prefLanguage === 'English' ? '' : '杯'}`
                            : `￥${donutTotal.toFixed(1)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      {brandDonutItems.map(item => (
                        <div key={item.brand} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getBrandColor(item.brand) }} />
                            <span className="text-text-main font-medium truncate">{item.brand}</span>
                          </div>
                          <div className="text-text-muted font-medium shrink-0">
                            {brandDonutMode === 'cups' ? `${item.cups}${prefLanguage === 'English' ? '' : '杯'}` : `￥${item.cost.toFixed(1)}`} · {(item.ratio * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[124px] rounded-2xl bg-bg-input/70 flex items-center justify-center text-sm text-text-muted">
                    {prefLanguage === 'English' ? 'No tastings in this period yet' : '这段时间还没有品鉴'}
                  </div>
                )}
              </div>
               
              <div className="bg-bg-card rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] col-span-2">
                <span className="text-base text-text-main font-bold block mb-4">{chartTitle}</span>
                <div className="flex justify-between items-end h-[100px] gap-1 sm:gap-2 mt-2">
                  {chartValues.map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                      <span className="text-text-muted text-xs font-bold min-h-[16px]">{val > 0 ? val : ''}</span>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: val > 0 ? `${Math.max((val / maxChartVal) * 100, 8)}%` : '4px' }}
                        className={`w-full max-w-[36px] rounded-t-[6px] rounded-b-[2px] transition-all duration-500 ${val > 0 ? 'bg-gradient-to-b from-[#A58E72] to-[#8E7558]' : 'bg-transparent'}`}
                      />
                      <span className="text-[10px] text-text-muted font-medium whitespace-nowrap mt-1 flex-shrink-0">{chartLabels[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
              
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-12 space-y-5">
            <h1 className="text-4xl font-bold mb-6 tracking-tight text-text-main">
              {prefLanguage === 'English' ? 'Settings' : '设置'}
            </h1>
          {/* 👇 终极视觉优化：至尊荣誉大奖牌入口 */}
            {(() => {
                // 🧠 统一核心成就判断引擎
                const unlocked = new Set<string>();
                if (records.length >= 1) unlocked.add('first_blood'); 
                if (records.length >= 200) unlocked.add('fifty_cups'); 
                
                const brands = new Set(records.map(r => r.brand).filter(Boolean));
                if (brands.size >= 15) unlocked.add('five_brands'); 
                
                const noSugarCount = records.filter(r => r.sweetness === '不另外加糖').length;
                if (noSugarCount >= 50) unlocked.add('no_sugar'); 
                
                if (records.some(r => r.cost >= 15)) unlocked.add('rich_guy'); 

                // 👉 修正排序与连续天数逻辑，删除重复定义
                let loyal = false;
                let currentConsecutive = 1;
                const sorted = [...records].sort((a, b) => {
                    if (b.year !== a.year) return b.year - a.year;
                    if (b.month !== a.month) return b.month - a.month;
                    if (b.day !== a.day) return b.day - a.day;
                    return parseInt(b.id) - parseInt(a.id);
                });
                
                for(let i=0; i<sorted.length - 1; i++) {
                   if (sorted[i].brand && sorted[i].brand === sorted[i+1].brand) {
                       currentConsecutive++;
                       if (currentConsecutive >= 20) { loyal = true; break; }
                   } else {
                       currentConsecutive = 1;
                   }
                }
                if (loyal) unlocked.add('loyalist');

                const iceCount = records.filter(r => r.temperature?.includes('冰')).length;
                if (iceCount >= 100) unlocked.add('ice_king'); 
                
                const hotCount = records.filter(r => r.temperature?.includes('热')).length;
                if (hotCount >= 100) unlocked.add('hot_king'); 

                const totalCount = 8; 
                const unlockedCount = unlocked.size;

                return (
                    <div 
                        onClick={() => setShowAchievementsModal(true)}
                        className="w-full relative rounded-[24px] p-6 shadow-[0_12px_40px_rgba(142,117,88,0.2)] cursor-pointer hover:shadow-2xl active:scale-95 transition-all overflow-hidden border-4"
                        style={{
                            // 1. 拟物化金色拉丝金属边框
                            borderColor: '#D2B48C',
                            // 2. 奢华的黑金拉丝纹理背景
                            background: 'linear-gradient(135deg, #2D1B10 0%, #3E2723 50%, #2D1B10 100%)'
                        }}
                    >
                        {/* 3. 霓虹金色光晕装饰 (纯前端光影魔法) */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D2B48C]/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#A58E72]/15 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="flex flex-col relative z-10">
                            {/* 顶部标题与图标行 */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <h3 className="text-[20px] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#D2B48C] to-white">
                                        {prefLanguage === 'English' ? 'MY ACHVMENTS' : '老糖人荣誉勋章'}
                                    </h3>
                                    <div className="text-[11px] font-bold text-[#A58E72]/80 mt-0.5 font-mono">
                                        MILK TEA MILESTONES
                                    </div>
                                </div>
                                <div className="text-4xl filter drop-shadow-md">👑</div>
                            </div>

                            {/* 👉 核心诱惑：实时解锁进度展示 */}
                            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2 border border-white/5 shadow-inner">
                                <span className="text-[11px] font-bold text-white tracking-wider flex items-center gap-1.5">
                                    <Trophy size={14} className="text-[#D2B48C]" strokeWidth={2.5}/>
                                    {prefLanguage === 'English' ? `UNLOCKED: ${unlockedCount}/${totalCount}` : `已解锁: ${unlockedCount} / ${totalCount}`}
                                </span>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: `${(unlockedCount / totalCount) * 100}%` }} transition={{ duration: 1.5, type: 'spring', delay: 0.2 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#8E7558] to-[#D2B48C]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 下面是你原本的搜索框和设置项... */}
            <div className="bg-bg-card rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-4">
              <div className="p-4 border-b border-bg-input">
                <input type="text" value={settingsSearch} onChange={(e) => setSettingsSearch(e.target.value)} placeholder={prefLanguage === 'English' ? 'Search settings...' : '搜索设置项...'} className="w-full bg-bg-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7558]/30 transition-all" />
              </div>
              {settingMatches(['dark mode', '深色模式']) && <div className="p-4 font-medium flex justify-between items-center"><span className="text-text-main">{prefLanguage === 'English' ? 'Dark Mode' : '深色模式'}</span><button onClick={() => setIsDark(!isDark)} className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? '' : 'bg-border-main'}`} style={isDark ? { backgroundColor: themeAccent } : undefined}><div className={`w-5 h-5 bg-bg-card rounded-full absolute top-[2px] transition-transform ${isDark ? 'translate-x-[26px]' : 'translate-x-[2px]'}`}></div></button></div>}
              {settingMatches(['theme','主题色']) && <div className="p-4 border-t border-bg-input"><span className="text-sm font-medium block mb-2">{prefLanguage === 'English' ? 'Theme Accent' : '主题色'}</span><div className="flex gap-2">{['#8E7558','#1D7AFC','#0D9F6E','#D9487D','#F59E0B'].map(c => <button key={c} onClick={() => setThemeAccent(c)} className={`w-7 h-7 rounded-full border-2 ${themeAccent === c ? 'border-text-main' : 'border-transparent'}`} style={{backgroundColor:c}} />)}</div></div>}
              {settingMatches(['calendar image', 'calendar display', '日历图片', '品牌logo', '奶茶贴纸']) && <div className="p-4 border-t border-bg-input"><span className="text-sm font-medium block mb-2">{prefLanguage === 'English' ? 'Calendar Image' : '日历图片'}</span><div className="flex gap-2">{([{ key: 'brand', label: prefLanguage === 'English' ? 'Brand Logo' : '品牌Logo' },{ key: 'upload', label: prefLanguage === 'English' ? 'Uploaded Photo' : '奶茶贴纸' }] as const).map(item => <button key={item.key} onClick={() => setCalendarImageMode(item.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${calendarImageMode === item.key ? 'text-white' : 'bg-bg-input text-text-muted'}`} style={calendarImageMode === item.key ? { backgroundColor: themeAccent } : undefined}>{item.label}</button>)}</div></div>}
              {settingMatches(['font','字体大小']) && <div className="p-4 border-t border-bg-input"><span className="text-sm font-medium block mb-2">{prefLanguage === 'English' ? 'Font Size' : '字体大小'}</span><div className="flex gap-2">{([{ key: 'small', label: prefLanguage === 'English' ? 'Small' : '小' },{ key: 'medium', label: prefLanguage === 'English' ? 'Medium' : '中' },{ key: 'large', label: prefLanguage === 'English' ? 'Large' : '大' }] as const).map(item => <button key={item.key} onClick={() => setFontScale(item.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${fontScale === item.key ? 'text-white' : 'bg-bg-input text-text-muted'}`} style={fontScale === item.key ? { backgroundColor: themeAccent } : undefined}>{item.label}</button>)}</div></div>}
              {settingMatches(['density','卡片密度']) && <div className="p-4 border-t border-bg-input"><span className="text-sm font-medium block mb-2">{prefLanguage === 'English' ? 'Card Density' : '卡片密度'}</span><div className="flex gap-2">{([{ key: 'compact', label: prefLanguage === 'English' ? 'Compact' : '紧凑' },{ key: 'comfortable', label: prefLanguage === 'English' ? 'Comfortable' : '舒适' }] as const).map(item => <button key={item.key} onClick={() => setCardDensity(item.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${cardDensity === item.key ? 'text-white' : 'bg-bg-input text-text-muted'}`} style={cardDensity === item.key ? { backgroundColor: themeAccent } : undefined}>{item.label}</button>)}</div></div>}
              {settingMatches(['week start', '起始日', '星期']) && <div className="p-4 border-t border-bg-input"><span className="text-sm font-medium block mb-2">{prefLanguage === 'English' ? 'Start of Week' : '日历起始日'}</span><div className="flex gap-2">{([{ key: 'sunday', label: prefLanguage === 'English' ? 'Sunday (周日)' : '周日' },{ key: 'monday', label: prefLanguage === 'English' ? 'Monday (周一)' : '周一' }] as const).map(item => <button key={item.key} onClick={() => setWeekStart(item.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${weekStart === item.key ? 'text-white' : 'bg-bg-input text-text-muted'}`} style={weekStart === item.key ? { backgroundColor: themeAccent } : undefined}>{item.label}</button>)}</div></div>}
              {/* 👉 目标与自律模式 */}
              {settingMatches(['limit', 'budget', '自律', '预算', '限制', '目标']) && (
                <div className="p-4 border-t border-bg-input">
                  <span className="text-sm font-medium block mb-3">
                    {prefLanguage === 'English' ? 'Discipline Mode (Optional)' : '自律模式 '}
                  </span>
                  <div className="space-y-3">
                    {/* 周目标设置 */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-bg-input rounded-xl p-2.5">
                        <span className="text-[10px] text-text-muted font-bold block mb-1">周预算 (￥)</span>
                        <input type="number" value={weeklyBudget} onChange={e => setWeeklyBudget(e.target.value)} placeholder="无" className="w-full bg-transparent text-sm font-bold focus:outline-none" />
                      </div>
                      <div className="flex-1 bg-bg-input rounded-xl p-2.5">
                        <span className="text-[10px] text-text-muted font-bold block mb-1">周杯数 (杯)</span>
                        <input type="number" value={weeklyCupLimit} onChange={e => setWeeklyCupLimit(e.target.value)} placeholder="无" className="w-full bg-transparent text-sm font-bold focus:outline-none" />
                      </div>
                    </div>
                    {/* 月目标设置 */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-bg-input rounded-xl p-2.5">
                        <span className="text-[10px] text-text-muted font-bold block mb-1">月预算 (￥)</span>
                        <input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} placeholder="无" className="w-full bg-transparent text-sm font-bold focus:outline-none" />
                      </div>
                      <div className="flex-1 bg-bg-input rounded-xl p-2.5">
                        <span className="text-[10px] text-text-muted font-bold block mb-1">月杯数 (杯)</span>
                        <input type="number" value={monthlyCupLimit} onChange={e => setMonthlyCupLimit(e.target.value)} placeholder="无" className="w-full bg-transparent text-sm font-bold focus:outline-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

             {settingMatches(['backup', 'restore', 'export', 'import', '备份', '恢复', '导出', '导入', '数据', '瘦身']) && (
                <div className="p-4 border-t border-bg-input">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-text-main">
                      {prefLanguage === 'English' ? 'Data Backup & Restore' : '数据备份与恢复'}
                    </span>
                    {/* 👉 新增的：一键瘦身按钮 (放在标题右侧，小巧精致) */}
                    <button 
                      onClick={handleCompressHistory}
                      className="text-[10px] bg-bg-app border border-border-main text-text-muted px-2 py-1 rounded-full font-bold hover:text-text-main active:scale-95 transition-all shadow-sm"
                    >
                      {prefLanguage === 'English' ? '🧹 Optimize Space' : '🧹 空间瘦身'}
                    </button>
                  </div>
                  
                  <div className="flex gap-3">
                    {/* 导出按钮 */}
                    <button 
                      onClick={handleExportData} 
                      className="flex-1 py-3 rounded-xl bg-bg-input text-text-main font-bold text-[13px] hover:bg-[#8E7558] hover:text-white transition-colors shadow-sm"
                    >
                      {prefLanguage === 'English' ? 'Export Data' : '导出备份 (.json)'}
                    </button>
                    
                    {/* 导入按钮 */}
                    <label className="flex-1 py-3 rounded-xl bg-bg-input text-text-main font-bold text-[13px] hover:bg-[#8E7558] hover:text-white transition-colors text-center cursor-pointer shadow-sm">
                      {prefLanguage === 'English' ? 'Import Data' : '恢复数据 (.json)'}
                      <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-bg-card rounded-[24px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-6">
              {settingMatches(['language', '语言']) && <div className="p-4 border-b border-bg-input"><label className="block text-xs font-medium text-text-muted mb-2">{prefLanguage === 'English' ? 'Language' : '语言'}</label><div className="flex gap-2">{['中文','English'].map(lang => <button key={lang} onClick={() => setPrefLanguage(lang)} className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${prefLanguage === lang ? 'text-white shadow-md' : 'bg-bg-input text-text-muted border-transparent hover:bg-border-main'}`} style={prefLanguage === lang ? { backgroundColor: themeAccent, borderColor: themeAccent } : undefined}>{lang}</button>)}</div></div>}
              {settingMatches(['temperature', '默认温度']) && <div className="p-4 border-b border-bg-input"><label className="block text-xs font-medium text-text-muted mb-2">{prefLanguage === 'English' ? 'Default Temperature' : '默认温度'}</label><div className="flex flex-wrap gap-2">{['热','正常冰','少冰','去冰'].map(temp => <button key={temp} onClick={() => setDefaultTemp(temp)} className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${defaultTemp === temp ? 'text-white shadow-md' : 'bg-bg-input text-text-muted border-transparent hover:bg-border-main'}`} style={defaultTemp === temp ? { backgroundColor: themeAccent, borderColor: themeAccent } : undefined}>{temp}</button>)}</div></div>}
              {settingMatches(['sweetness', '默认甜度']) && <div className="p-4"><label className="block text-xs font-medium text-text-muted mb-2">{prefLanguage === 'English' ? 'Default Sweetness' : '默认甜度'}</label><div className="flex flex-wrap gap-2">{['不另外加糖','三分糖','五分糖','七分糖','标准糖'].map(sweet => <button key={sweet} onClick={() => setDefaultSweet(sweet)} className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all active:scale-95 border ${defaultSweet === sweet ? 'text-white shadow-md' : 'bg-bg-input text-text-muted border-transparent hover:bg-border-main'}`} style={defaultSweet === sweet ? { backgroundColor: themeAccent, borderColor: themeAccent } : undefined}>{sweet}</button>)}</div></div>}
            </div>
            {/* 关于与开发者信息 */}
            <div className="mt-8 flex flex-col items-center justify-center space-y-3 opacity-60 hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowAboutUsModal(true)}
                className="px-4 py-2 bg-bg-input rounded-full text-xs font-bold text-text-muted hover:text-text-main transition-colors"
              >
                {prefLanguage === 'English' ? 'About Sugar Ultra' : '关于糖人app'}
              </button>
              <div className="text-[10px] text-text-muted font-mono tracking-widest uppercase">
                Designed with czdyph
              </div>
            </div>
          </motion.div>
        )}
      </div>

{/* Add Drink Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // 加上 backdrop-blur-sm 让背景有高级的毛玻璃虚化效果
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              // 🌟 核心重构 1：改为 flex 纵向布局，严格限制最大高度为 92vh，防止内部元素乱跑顶穿屏幕
              className="w-full bg-bg-card rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative sm:max-w-[400px] max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* 🌟 核心重构 2：独立吸顶 Header (带优雅的拖拽指示条) */}
              <div className="flex flex-col items-center pt-3 pb-4 px-6 bg-bg-card z-20 shrink-0 border-b border-border-main/40 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-1.5 bg-border-main rounded-full mb-4"></div>
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-[20px] font-black text-text-main tracking-tight">{editingRecordId ? '编辑奶茶' : '记录新奶茶'}</h2>
                  <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors active:scale-95" aria-label="关闭">
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* 🌟 核心重构 3：独立滚动内容区 (只有这里面可以上下滑) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6 bg-bg-app/30">
                
                {/* Image Picker */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 mx-auto bg-bg-input rounded-[22px] flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0 shadow-inner group ring-4 ring-bg-app"
                >
                  <>
                    {isExportableImageSrc(draftImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draftImage} alt="preview" className="w-full h-full object-contain filter drop-shadow-md scale-110" />
                    ) : (
                      <div className="flex flex-col items-center text-text-muted gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Coffee size={32} strokeWidth={1.8} />
                        <span className="text-[11px] font-bold tracking-widest">传照片</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm font-bold">更换</span>
                    </div>
                  </>
                </div>

                {/* Form: 增强了字重，加大了输入框的高度，增加了英文副标题提升排版质感 */}
                <div className="space-y-4">
                  {/* 日期 */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">日期 / Date</label>
                    <input
                      type="date"
                      value={draftDate}
                      onChange={e => setDraftDate(e.target.value)}
                      className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8E7558]/40 transition-all font-bold text-text-main shadow-sm border border-border-main/50"
                    />
                  </div>
                  
                  {/* 品牌 */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">品牌 / Brand</label>
                    <input
                      type="text"
                      value={draftBrand}
                      onChange={e => {
                        const val = e.target.value;
                        const matchedBrand = getBrandKey(val);
                        setDraftBrand(matchedBrand || val);
                      }}
                      placeholder="例如：霸王茶姬"
                      className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8E7558]/40 transition-all font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium shadow-sm border border-border-main/50"
                    />
                  </div>
                  
                  {/* 饮品名称 */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">名称 / Name</label>
                    <input
                      type="text"
                      value={draftName}
                      onChange={e => setDraftName(e.target.value)}
                      placeholder="例如：伯牙绝弦"
                      className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8E7558]/40 transition-all font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium shadow-sm border border-border-main/50"
                    />
                  </div>
                  
                  {/* 价格 */}
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">价格 / Price</label>
                    <div className="relative flex items-center shadow-sm rounded-2xl border border-border-main/50 bg-bg-card">
                      <span className="absolute left-4 text-text-muted font-black text-lg">￥</span>
                      <input
                        type="number"
                        value={draftCost}
                        onChange={e => setDraftCost(e.target.value)}
                        placeholder="20"
                        className="w-full bg-transparent rounded-2xl pl-10 pr-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#8E7558]/40 transition-all font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium"
                      />
                    </div>
                  </div>
                  
                  {/* Size, Temperature and Sweetness options */}
                  <div className="pt-4 mt-2 border-t border-border-main/60 space-y-5">
                    {/* 杯形 */}
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">杯型 / Size</label>
                      <div className="flex flex-wrap gap-2.5">
                        {['中杯', '大杯', '超大杯'].map(size => (
                          <button
                            key={size}
                            onClick={() => setDraftSize(size)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSize === size ? 'bg-[#8E7558] text-white shadow-[0_4px_10px_rgba(142,117,88,0.3)]' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 温度 */}
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">温度 / Temp</label>
                      <div className="flex flex-wrap gap-2.5">
                        {['热', '正常冰', '少冰', '去冰'].map(temp => (
                          <button
                            key={temp}
                            onClick={() => setDraftTemperature(temp)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftTemperature === temp ? 'bg-[#8E7558] text-white shadow-[0_4px_10px_rgba(142,117,88,0.3)]' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}
                          >
                            {temp}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 甜度 */}
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">甜度 / Sweet</label>
                      <div className="flex flex-wrap gap-2.5">
                        {getSweetnessOptions(draftBrand).map(sweet => (
                          <button 
                            key={sweet}
                            onClick={() => setDraftSweetness(sweet)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSweetness === sweet ? 'bg-[#8E7558] text-white shadow-[0_4px_10px_rgba(142,117,88,0.3)]' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}
                          >
                            {sweet}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌟 核心重构 4：独立固定的底部按钮区 (永远悬浮，绝不被切) */}
              <div className="p-5 pt-4 bg-bg-card border-t border-border-main/40 shrink-0 z-20">
                <button 
                  onClick={handleSaveDrink}
                  className="w-full bg-gradient-to-r from-[#8E7558] to-[#A58E72] text-white py-4 rounded-full text-[16px] font-bold shadow-[0_8px_20px_rgba(142,117,88,0.25)] active:scale-95 transition-transform flex justify-center items-center gap-2"
                >
                  <span>保存记录</span>
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#1a1a1e] flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              ref={receiptCardRef}
              // 👇 1. 缩小卡片内边距 (pt-7 -> pt-5, px-6 -> px-5)
              className="bg-[#f8f8f8] w-full max-w-[340px] rounded-t-2xl relative flex flex-col pt-5 pb-3 px-5 text-gray-800 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="flex justify-between items-start relative mb-3">
                  {/* 👇 2. 缩小顶部英文标题字号 (48px -> 36px) */}
                  <div className="font-extrabold text-[36px] tracking-tight leading-[0.95] text-[#102a4a]">
                      {prefLanguage === 'English' ? 'Boba Bill' : '奶茶账单'}<br/>Receipt
                  </div>
                  {/* 👇 3. 缩小右上角照片/图标尺寸 */}
                  <div className="w-16 h-20 mr-1">
                      {statRecords.length > 0 && isExportableImageSrc(statRecords[statRecords.length - 1].imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={statRecords[statRecords.length - 1].imageUrl} className="w-full h-full object-contain filter drop-shadow-xl" alt="boba" />
                      ) : (
                          <Coffee size={56} className="text-[#102a4a] mt-1 ml-1 drop-shadow-xl" strokeWidth={1.8} />
                      )}
                  </div>
              </div>
              
              <div className="border-b-2 border-black/80 mb-4 w-full"></div>
              
              <div className="mb-4">
                  {/* 👇 4. 缩小主标题字号 (52px -> 40px) */}
                  <h1 className="text-[40px] font-black tracking-[-0.04em] leading-none mb-1 text-[#102a4a]">
                      {statPeriod === 'week' ? (prefLanguage === 'English' ? 'Weekly' : '本周统计') : 
                       statPeriod === 'month' ? (prefLanguage === 'English' ? 'Monthly' : '本月统计') : 
                       (prefLanguage === 'English' ? 'Yearly' : '年度统计')}
                  </h1>
                  <div className="text-[10px] text-gray-400 font-mono tracking-[0.24em] uppercase">
                      No.BL{new Date().getTime().toString().slice(-10)}
                  </div>
              </div>
              
              <div className="border-b border-dashed border-gray-300 mb-4 w-full"></div>
              
              {/* 1. 全新网格化指标区 (压缩间距) */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[12px] font-medium text-gray-800 mb-4">
                  <div>
                      <div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'PERIOD' : '统计周期'}</div>
                      <div className="font-bold text-[13px]">{statDateLabel}</div>
                  </div>
                  <div>
                      <div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'TOTAL CUPS' : '杯数（总）'}</div>
                      <div className="font-bold text-[13px]">{statCups} {prefLanguage === 'English' ? 'Cups' : '杯'}</div>
                  </div>
                  
                  {statCups > 0 && (
                      <>
                          <div>
                              <div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'FAV BRAND' : '品牌（最爱）'}</div>
                              <div className="font-bold text-[13px] truncate pr-2">{receiptTopBrand}</div>
                          </div>
                          <div>
                              <div className="text-gray-400 tracking-wider text-[9px] mb-0.5">{prefLanguage === 'English' ? 'PREF SPEC' : '规格（最常点）'}</div>
                              <div className="font-bold text-[13px] truncate">{receiptTopTemp} · {receiptTopSweet}</div>
                          </div>
                      </>
                  )}

                  <div className="col-span-2 pt-2 mt-1 border-t border-dashed border-gray-200 flex justify-between items-end">
                      <span className="text-gray-400 tracking-wider text-[11px] mb-1">{prefLanguage === 'English' ? 'TOTAL COST' : '消费金额'}</span>
                      {/* 👇 5. 缩小总金额字号 (36px -> 32px) */}
                      <span className="font-black text-[32px] leading-none text-[#102a4a]">￥{parseFloat(statCost.toFixed(2))}</span>
                  </div>
              </div>

              {/* 2. 紧凑版品牌消费清单 (压缩行高) */}
              {statCups > 0 && (
                <div className="mb-3 border-y border-dashed border-gray-300 py-2">
                  <div className="flex justify-between text-[9px] text-gray-400 font-bold mb-1.5 tracking-widest">
                    <span>{prefLanguage === 'English' ? 'BRAND / QTY' : '品牌 / 数量'}</span>
                    <span>{prefLanguage === 'English' ? 'AMOUNT' : '金额'}</span>
                  </div>
                  <div className="space-y-1.5">{mergedBrandMetrics.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[12px] text-[#102a4a]">{item.brand}</span>
                        <span className="text-[9px] text-gray-500 font-mono">x{item.cups}</span>
                      </div>
                      <div className="font-black text-[13px] text-[#102a4a]">￥{item.cost.toFixed(1)}</div>
                    </div>
                  ))}
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-dotted border-gray-200">
                      <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                        <span>{prefLanguage === 'English' ? 'Happiness Tax (100%)' : '多巴胺附加税 (100%)'}</span>
                        <span className="italic">Included / 已免除</span>
                      </div>
                  </div>
                </div>
              )}
              
              {/* 4. 趣味称号区 */}
              <div className="mt-2 mb-2 flex flex-col items-center justify-center">
                <div className="text-[9px] text-gray-400 font-bold tracking-widest mb-1.5">
                  {prefLanguage === 'English' ? 'CURRENT STATUS' : '- 本期饮茶成就 -'}
                </div>
                <div className="border-[2px] border-[#102a4a] text-[#102a4a] px-3 py-0.5 font-black text-[11px] tracking-widest uppercase transform -rotate-2 bg-[#f8f8f8] shadow-sm">
                  {getReceiptTitle(statCups, statPeriod, prefLanguage)}
                </div>
              </div>
              <div className="text-center text-[9px] text-gray-300 font-mono mb-2 uppercase tracking-[0.22em]">
                {prefLanguage === 'English' ? 'Sugar Time' : 'Sugar Time'}
              </div>
              <div className="border-b border-dashed border-gray-300 mb-2 w-full"></div>
              
              {/* 👇 6. 降低底部条形码高度 (h-11 -> h-8) */}
              <div className="flex justify-center h-8 opacity-80 mb-1">
                   {Array.from({length: 40}).map((_, i) => (
                      <div key={i} className={`h-full bg-black mx-[0.5px] ${i%3===0 ? 'w-1' : i%5===0 ? 'w-1.5' : 'w-[2px]'}`}></div>
                   ))}
              </div>
              
              {/* Bottom serration */}
              <div className="absolute -bottom-[6px] left-0 right-0 h-3 flex justify-around px-1 overflow-hidden pointer-events-none">
                {Array.from({length: 30}).map((_, i) => (
                  <div key={`dot-${i}`} className="w-[8px] h-[8px] rounded-full bg-[#1a1a1e]"></div>
                ))}
              </div>
            </motion.div>
            
            {/* Buttons Below */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-4 mt-8 w-full max-w-[360px]"
            >
                <button onClick={() => handleSaveReceipt(receiptCardRef)} className="flex-1 py-3.5 rounded-full border border-white/80 text-white font-bold bg-transparent tracking-widest text-sm hover:bg-white/10 transition-colors shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
      {prefLanguage === 'English' ? 'SAVE' : '保存小票'}
  </button>
  <button onClick={() => handleShareReceipt(receiptCardRef)} className="flex-1 py-3.5 rounded-full bg-white text-black font-bold tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-[0_10px_24px_rgba(255,255,255,0.25)]">
      {prefLanguage === 'English' ? 'SHARE' : '分享'}
  </button>
            </motion.div>
            
            {/* Round X button at the very bottom */}
            <motion.button 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => setShowReceiptModal(false)} 
              className="mt-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl pb-1 shadow-lg hover:bg-gray-100 transition-colors"
            >
                <X size={22} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About Us Modal */}
      <AnimatePresence>
        {showAboutUsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg-card w-full max-w-[320px] rounded-[32px] shadow-2xl relative flex flex-col p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#8E7558]/20 to-transparent"></div>
              
              <button 
                onClick={() => setShowAboutUsModal(false)} 
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors z-10"
                aria-label="关闭"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="flex flex-col items-center justify-center mb-6 relative z-10">
                <div className="mb-4 drop-shadow-md">
                  <Coffee size={56} className="text-[#8E7558]" strokeWidth={1.8} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-text-main mb-1">
                  Sugar Log
                </h2>
                <div className="text-sm font-medium text-[#8E7558]">
                  Version 1.0.0
                </div>
              </div>

              <div className="text-center text-[15px] leading-relaxed text-text-muted mb-8 relative z-10">
                {prefLanguage === 'English' ? (
                  <>
                    <p className="mb-4">
                      A simple, beautiful way to track your daily sugar intake.
                    </p>
                    <p>
                      Crafted for sugar lovers everywhere. Our mission is to help you remember every perfect sip and sweet moment.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4">
                      一个简洁的老糖人奶茶App。
                    </p>
                    <p>
                      为全世界的老糖人爱好者用心打造。我们的使命是帮你记住每一口糖。
                    </p>
                  </>
                )}
              </div>

              <div className="flex justify-center gap-4 relative z-10">
                <a href="https://github.com/czdyph/laotangren-app" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-text-main hover:bg-[#8E7558] hover:text-white transition-colors">
                  <Info size={18} strokeWidth={2.2} />
                </a>
                <a href="mailto:yhdp921@gmail.com" className="w-10 h-10 rounded-full bg-bg-input flex items-center justify-center text-text-main hover:bg-[#8E7558] hover:text-white transition-colors">
                  <MessageSquare size={18} strokeWidth={2.2} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🌟 Single Drink Receipt Modal (单杯专属小票) */}
      <AnimatePresence>
        {shareRecord && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#1a1a1e] flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              ref={singleReceiptRef}
              className="bg-[#f8f8f8] w-full max-w-[360px] rounded-t-2xl relative flex flex-col pt-7 pb-4 px-6 text-gray-800 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
            >
              {/* Header */}
              {/* --- 1. 顶部抬头：品牌 Logo 居中显示 --- */}
              <div className="flex justify-center items-center w-full mb-5 mt-2 min-h-[4rem]">
                  {shareRecord.brand && getBrandLogoFile(shareRecord.brand) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                          src={`/logos/${getBrandLogoFile(shareRecord.brand)}`}
                          alt={shareRecord.brand}
                          className="h-16 w-auto object-contain filter drop-shadow-sm"
                      />
                  ) : (
                      <div className="flex flex-col items-center">
                          <div className="font-extrabold text-[36px] tracking-tight leading-[0.95] text-[#102a4a]">
                              {prefLanguage === 'English' ? 'Boba Bill' : '奶茶账单'}
                          </div>
                          <div className="text-[12px] font-bold tracking-widest text-[#102a4a] mt-1">RECEIPT</div>
                      </div>
                  )}
              </div>
              
              {/* 粗分割线 */}
              <div className="border-b-[3px] border-[#102a4a] mb-6 w-full"></div>
              
              {/* --- 2. 主体区：饮品名称(左) + 奶茶实拍贴纸(右) --- */}
              <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 pr-4 pt-2">
                      <h1 className="text-[36px] font-black tracking-tight leading-[1.1] mb-2 text-[#102a4a] break-words">
                          {shareRecord.type || '今日奶茶'}
                      </h1>
                      <div className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
                          NO.{shareRecord.id}
                      </div>
                  </div>
                  
                  {/* 奶茶贴纸：利用负边距使其稍微向上突破分割线，增加手账拼贴感 */}
                  <div className="w-24 h-28 shrink-0 relative -mt-8 mr-1">
                      {isExportableImageSrc(shareRecord.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shareRecord.imageUrl} className="w-full h-full object-contain filter drop-shadow-2xl scale-[1.15]" alt="boba" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#f0f0f0] rounded-2xl rotate-3 shadow-inner">
                              <Coffee size={48} className="text-[#102a4a]/40" strokeWidth={1.5} />
                          </div>
                      )}
                  </div>
              </div>
              
              <div className="border-b border-dashed border-gray-300 mb-6 w-full"></div>
              
              
              
              {/* 单杯详细规格 */}
              <div className="space-y-4 text-[13px] font-medium text-gray-800 mb-5">
                  <div className="flex justify-between">
                      <span className="text-gray-400 tracking-wider text-xs">日期 / DATE</span>
                      <span className="font-bold text-[15px]">{shareRecord.year}年{shareRecord.month + 1}月{shareRecord.day}日</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-400 tracking-wider text-xs">品牌 / BRAND</span>
                      <span className="font-bold text-[15px]">{shareRecord.brand || (prefLanguage === 'English' ? 'Unlabeled' : '未标记品牌')}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-400 tracking-wider text-xs">规格 / SPECS</span>
                      <span className="font-bold text-[15px]">{shareRecord.size} · {shareRecord.temperature} · {shareRecord.sweetness}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between items-end">
                      <span className="text-gray-400 tracking-wider text-xs mb-1">金额 / AMOUNT</span>
                      <span className="font-black text-[38px] leading-none text-[#102a4a]">￥{shareRecord.cost}</span>
                  </div>
              </div>

              <div className="text-center text-[10px] text-gray-300 font-mono mb-3 uppercase mt-2 tracking-[0.22em]">
                  Sugar Time
              </div>
              
              <div className="border-b border-dashed border-gray-300 mb-4 w-full"></div>
              
              {/* Barcode Mock */}
              <div className="flex justify-center h-11 opacity-80 mb-1">
                   {Array.from({length: 40}).map((_, i) => (
                      <div key={i} className={`h-full bg-black mx-[0.5px] ${i%3===0 ? 'w-1' : i%5===0 ? 'w-1.5' : 'w-[2px]'}`}></div>
                   ))}
              </div>
              
              {/* Bottom serration */}
              <div className="absolute -bottom-[6px] left-0 right-0 h-3 flex justify-around px-1 overflow-hidden pointer-events-none">
                {Array.from({length: 30}).map((_, i) => (
                  <div key={`dot-${i}`} className="w-[8px] h-[8px] rounded-full bg-[#1a1a1e]"></div>
                ))}
              </div>
            </motion.div>
            
            {/* 保存分享操作栏 */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 mt-8 w-full max-w-[360px]">
                <button onClick={() => handleSaveReceipt(singleReceiptRef)} className="flex-1 py-3.5 rounded-full border border-white/80 text-white font-bold bg-transparent tracking-widest text-sm hover:bg-white/10 transition-colors shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
                    {prefLanguage === 'English' ? 'SAVE' : '保存小票'}
                </button>
                <button onClick={() => handleShareReceipt(singleReceiptRef)} className="flex-1 py-3.5 rounded-full bg-white text-black font-bold tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-[0_10px_24px_rgba(255,255,255,0.25)]">
                    {prefLanguage === 'English' ? 'SHARE' : '分享'}
                </button>
            </motion.div>
            
            <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onClick={() => setShareRecord(null)} className="mt-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl pb-1 shadow-lg hover:bg-gray-100 transition-colors">
                <X size={22} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🌟 Spotify 风格月度/年度总结海报 */}
      <AnimatePresence>
        {showPosterModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
          >
            {/* 核心海报内容区 (这个 div 就是最终截图的区域) */}
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              ref={posterRef}
              className="w-full max-w-[360px] rounded-3xl relative flex flex-col p-8 text-white shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{
                // 极具质感的暗黑渐变背景
                background: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #4c1d95 100%)'
              }}
            >
              {/* 背景装饰光斑 */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* 顶部标识 */}
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="text-xs font-bold tracking-[0.3em] uppercase text-white/60">
                  Sugar Ultra
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md text-xs font-bold border border-white/10">
                  {statDateLabel}
                </div>
              </div>

              {/* 标题与大数字 */}
              <div className="relative z-10 mb-8">
                <h1 className="text-[28px] font-black tracking-tight leading-tight mb-2">
                  {prefLanguage === 'English' ? 'Your Boba Wrapped' : '你的饮茶回忆录'}
                </h1>
                <div className="flex items-baseline gap-2">
                  <span className="text-[72px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
                    {statCups}
                  </span>
                  <span className="text-xl font-bold text-white/80">{prefLanguage === 'English' ? 'Cups' : '杯'}</span>
                </div>
              </div>

              {/* 👉 核心：动态文案生成引擎 */}
              <div className="space-y-5 relative z-10 flex-1">
                {(() => {
                  let intro = prefLanguage === 'English' 
                    ? `You've consumed ${statCups} cups during this period.` 
                    : `在这个周期里，你共消耗了 ${statCups} 杯快乐水。`;
                  if (statCups > 20) {
                    intro = prefLanguage === 'English' 
                      ? `Swimming in boba! You enjoyed a massive ${statCups} cups.` 
                      : `你简直是泡在奶茶里！共消耗了惊人的 ${statCups} 杯生命之水。`;
                  } else if (statCups <= 5 && statCups > 0) {
                    intro = prefLanguage === 'English' 
                      ? `Amazing self-control! Only ${statCups} cups consumed.` 
                      : `你展现了惊人的克制力，仅用 ${statCups} 杯就安稳度过。`;
                  }

                  let brandStr = "";
                  if (receiptTopBrand !== '无' && receiptTopBrand !== 'None' && statCups > 0) {
                     brandStr = prefLanguage === 'English'
                       ? `Your most loyal companion was 「${receiptTopBrand}」.`
                       : `你最长情的陪伴是「${receiptTopBrand}」，它是你最稳定的多巴胺来源。`;
                  } else if (statCups > 0) {
                     brandStr = prefLanguage === 'English'
                       ? `You love exploring all kinds of brands.`
                       : `你是个博爱的人，雨露均沾，没有偏爱任何一家。`;
                  }

                  let specStr = "";
                  if (statCups > 0) {
                     specStr = prefLanguage === 'English'
                       ? `You're a firm believer in 「${receiptTopTemp} + ${receiptTopSweet}」.`
                       : `你是个坚定的「${receiptTopTemp} · ${receiptTopSweet}」党，这是你不妥协的口味底线。`;
                  }

                  return (
                    <>
                      <p className="text-[15px] font-medium leading-relaxed text-white/90">
                        {intro}
                      </p>
                      <p className="text-[15px] font-medium leading-relaxed text-white/90">
                        {brandStr}
                      </p>
                      <p className="text-[15px] font-medium leading-relaxed text-white/90">
                        {specStr}
                      </p>
                      <p className="text-[15px] font-medium leading-relaxed text-white/90">
                        {prefLanguage === 'English' 
                          ? `Total investment in happiness: ￥${statCost.toFixed(1)}.` 
                          : `你累计向饮茶事业投资了 ￥${statCost.toFixed(1)}，实力有目共睹。`}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* 底部成就印章区域 */}
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end relative z-10">
                <div className="text-[10px] text-white/40 font-mono">
                  GENERATED BY<br/>SUGAR ULTRA
                </div>
                {/* 借用你之前的印章逻辑，做成潮牌贴纸效果 */}
                <div className="border-[3px] border-pink-400 text-pink-300 px-4 py-2 font-black text-[16px] tracking-widest uppercase transform rotate-6 bg-black/20 backdrop-blur-sm shadow-[0_0_15px_rgba(244,114,182,0.3)]">
                  {getReceiptTitle(statCups, statPeriod, prefLanguage)}
                </div>
              </div>
            </motion.div>
            
            {/* 悬浮操作栏 (不包含在截图中) */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 mt-8 w-full max-w-[360px]">
                <button onClick={() => handleSaveReceipt(posterRef)} className="flex-1 py-3.5 rounded-full border border-white/30 text-white font-bold bg-white/10 backdrop-blur-md tracking-widest text-sm hover:bg-white/20 transition-colors">
                    {prefLanguage === 'English' ? 'SAVE' : '保存海报'}
                </button>
                <button onClick={() => handleShareReceipt(posterRef)} className="flex-1 py-3.5 rounded-full bg-white text-black font-bold tracking-widest text-sm hover:bg-gray-100 transition-colors shadow-lg">
                    {prefLanguage === 'English' ? 'SHARE' : '分享海报'}
                </button>
            </motion.div>
            
            <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onClick={() => setShowPosterModal(false)} className="mt-8 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center font-bold text-xl pb-1 hover:bg-white/20 transition-colors border border-white/20">
                <X size={22} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

        {/* 🌟 成就勋章墙弹窗 (全自动计算逻辑 + 时光倒流算法) */}
      <AnimatePresence>
        {showAchievementsModal && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-[120] bg-bg-app flex flex-col sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main"
          >
            {(() => {
             // 🧠 核心：时光倒流算法 (按真实的饮用日期从老到新排，解决补录数据时间错乱Bug)
              const unlockedMap = new Map(); // 用于存储成就ID和对应的【触发饮品记录】
              const chronological = [...records].sort((a, b) => {
                  if (a.year !== b.year) return a.year - b.year;
                  if (a.month !== b.month) return a.month - b.month;
                  if (a.day !== b.day) return a.day - b.day;
                  return parseInt(a.id) - parseInt(b.id); // 同一天的按录入先后顺序
              });
              let brandSet = new Set();
              let noSugarCount = 0;
              let iceCount = 0;
              let hotCount = 0;
              let loyalCount = 1;

              for (let i = 0; i < chronological.length; i++) {
                 const r = chronological[i];

                 // 1. 初次邂逅
                 if (i === 0 && !unlockedMap.has('first_blood')) unlockedMap.set('first_blood', r);
                 // 8. 奶茶土匪
                 if (i === 199 && !unlockedMap.has('fifty_cups')) unlockedMap.set('fifty_cups', r);

                 // 3. 海王品鉴
                 if (r.brand && !brandSet.has(r.brand)) {
                     brandSet.add(r.brand);
                     if (brandSet.size === 15 && !unlockedMap.has('five_brands')) unlockedMap.set('five_brands', r);
                 }

                 // 4. 清糖苦行僧
                 if (r.sweetness === '不另外加糖') {
                     noSugarCount++;
                     if (noSugarCount === 50 && !unlockedMap.has('no_sugar')) unlockedMap.set('no_sugar', r);
                 }

                 // 7. 破产预警
                 if (r.cost >= 15 && !unlockedMap.has('rich_guy')) unlockedMap.set('rich_guy', r);

                 // 2. 品牌死忠
                 if (i > 0) {
                     if (r.brand && r.brand === chronological[i-1].brand) {
                         loyalCount++;
                         if (loyalCount === 7 && !unlockedMap.has('loyalist')) unlockedMap.set('loyalist', r);
                     } else {
                         loyalCount = 1; // 中断，重新计算
                     }
                 }

                 // 5. 绝对零度
                 if (r.temperature?.includes('冰')) {
                     iceCount++;
                     if (iceCount === 100 && !unlockedMap.has('ice_king')) unlockedMap.set('ice_king', r);
                 }

                 // 6. 养生达人
                 if (r.temperature?.includes('热')) {
                     hotCount++;
                     if (hotCount === 100 && !unlockedMap.has('hot_king')) unlockedMap.set('hot_king', r);
                 }
              }

              // 成就字典数据 (注入了你刚才定稿的专属文案)
              const achievementsList = [
                { id: 'first_blood', icon: '🍼', title: '初次邂逅', desc: '记录你的第一杯饮品', isUnlocked: unlockedMap.has('first_blood'), trigger: unlockedMap.get('first_blood'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，命运的齿轮开始转动。`, comment: `这是你在《老糖人》记录的第一杯奶茶。当时的你一定没想过，这仅仅是一条“不归路”的开始……` }) },
                { id: 'loyalist', icon: '❤️', title: '品牌死忠', desc: '连续 7 杯喝同一个品牌', isUnlocked: unlockedMap.has('loyalist'), trigger: unlockedMap.get('loyalist'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你达成了最高级别的羁绊。`, comment: `连续 7 杯「${t.brand || '该品牌'}」！你这已经不是爱了，你简直是他们家流落在外的野生代言人。建议拿着这串记录直接去找老板入股。` }) },
                { id: 'five_brands', icon: '🌍', title: '海王品鉴', desc: '品尝过 15 个不同的品牌', isUnlocked: unlockedMap.has('five_brands'), trigger: unlockedMap.get('five_brands'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的花心版图再次扩张。`, comment: `在尝遍了 14 个品牌后，最终是这杯「${t.brand || '新品牌'}」帮你补齐了海王拼图。你没有偏爱，你只是心碎成了 15 瓣，每一瓣都爱着不同的快乐水。` }) },
                { id: 'no_sugar', icon: '🧘', title: '清糖苦行僧', desc: '累计喝过 50 杯不另外加糖', isUnlocked: unlockedMap.has('no_sugar'), trigger: unlockedMap.get('no_sugar'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你立地成佛。`, comment: `累计 50 杯“不另外加糖”！你点的是奶茶吗？不，你点的是对世俗欲望的无情嘲讽。全国 99% 的清糖佛子正在为你点赞。` }) },
                { id: 'ice_king', icon: '🧊', title: '绝对零度', desc: '累计喝过 100 杯冷饮', isUnlocked: unlockedMap.has('ice_king'), trigger: unlockedMap.get('ice_king'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的胃壁凝结成冰。`, comment: `第 100 杯冷饮下肚！就算是凛冬将至，也无法阻止你对冰块的狂热。承认吧，你的血液里现在流淌的都是冰水混合物。` }) },
                { id: 'hot_king', icon: '♨️', title: '养生达人', desc: '累计喝过 100 杯热饮', isUnlocked: unlockedMap.has('hot_king'), trigger: unlockedMap.get('hot_king'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，保温杯里泡枸杞。`, comment: `第 100 杯热饮！你成功把奶茶喝出了老中医熬药的养生感。这杯烫嘴的「${t.type}」，是你对多巴胺最后的倔强。` }) },
                { id: 'rich_guy', icon: '💸', title: '破产预警', desc: '点过一杯价格超过 15 元的饮品', isUnlocked: unlockedMap.has('rich_guy'), trigger: unlockedMap.get('rich_guy'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的钱包发出了悲鸣。`, comment: `这杯高达 ${t.cost} 元的「${t.brand || ''} · ${t.type}」，刺痛了钱包，却抚慰了灵魂。没关系，钱没有消失，它只是变成了你身上的肉肉陪着你。` }) },
                { id: 'fifty_cups', icon: '👑', title: '奶茶土匪', desc: '累计记录达到 200 杯', isUnlocked: unlockedMap.has('fifty_cups'), trigger: unlockedMap.get('fifty_cups'), 
                  buildText: (t:any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你登上了糖分王座。`, comment: `第 200 杯！你已经不是普通的爱好者了，你是让整条街奶茶店老板都笑得合不拢嘴的老糖人。` }) },
              ];

              const unlockedCount = achievementsList.filter(a => a.isUnlocked).length;

              return (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-bg-app z-20">
                    <div className="flex flex-col">
                      <h2 className="text-3xl font-black text-text-main tracking-tight mb-1">
                        {prefLanguage === 'English' ? 'Achievements' : '成就图鉴'}
                      </h2>
                      <span className="text-sm font-bold text-[#8E7558]">
                        已解锁: {unlockedCount} / {achievementsList.length}
                      </span>
                    </div>
                    <button onClick={() => setShowAchievementsModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors shadow-sm">
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-5 py-2 pb-10 custom-scrollbar relative">
                    <div className="w-full h-2 bg-bg-input rounded-full mb-6 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(unlockedCount / achievementsList.length) * 100}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-[#8E7558] to-[#D2B48C] rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {achievementsList.map((ach, idx) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          key={ach.id}
                          // 👇 核心交互：点击已解锁的展示SSR卡片，点击未解锁的震动+Toast提示
                          onClick={() => {
                              if (ach.isUnlocked) {
                                  triggerHaptic('medium');
                                  setSelectedAchv(ach);
                              } else {
                                  triggerHaptic('light');
                                  showToast('还差一点哦，继续喝起来吧！', 'info');
                              }
                          }}
                          className={`relative p-4 rounded-[24px] border-2 flex flex-col items-center text-center transition-all overflow-hidden ${
                            ach.isUnlocked 
                              ? 'bg-bg-card border-[#8E7558]/30 shadow-[0_4px_15px_rgba(142,117,88,0.1)] cursor-pointer hover:scale-105 active:scale-95' 
                              : 'bg-bg-input/30 border-transparent grayscale opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {ach.isUnlocked && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#8E7558]/10 rounded-full blur-xl pointer-events-none"></div>}
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
        {/* 🌟 隐藏款 SSR 高光成就展示卡片 (Centered Modal) */}
      <AnimatePresence>
        {selectedAchv && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              id="achievement-card" // 👈 添加这个 ID
              initial={{ scale: 0.8, y: 20, rotateX: 20 }}
              animate={{ scale: 1, y: 0, rotateX: 0 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-[340px] bg-bg-card rounded-[32px] p-6 relative shadow-[0_30px_80px_rgba(0,0,0,0.4)] flex flex-col items-center text-center overflow-hidden border border-border-main/50"
            >
              {/* 顶部神圣光晕 */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D2B48C]/20 rounded-full blur-3xl pointer-events-none"></div>

              {/* 标题区 */}
              <div className="text-[64px] mb-2 relative z-10 drop-shadow-xl filter">{selectedAchv.icon}</div>
              <h2 className="text-3xl font-black text-text-main mb-2 tracking-tight relative z-10">{selectedAchv.title}</h2>
              <div className="text-[11px] font-bold text-[#8E7558] mb-6 relative z-10 bg-[#8E7558]/10 px-3 py-1 rounded-full">
                {selectedAchv.buildText(selectedAchv.trigger).date}
              </div>

              {/* 核心相框：高光见证者 */}
              <div className="w-full bg-bg-input/60 rounded-[20px] p-3 flex items-center gap-4 mb-6 shadow-inner relative z-10 border border-border-main/50">
                 <div className="w-16 h-20 shrink-0 bg-white/50 rounded-xl flex items-center justify-center shadow-sm p-1">
                    {isExportableImageSrc(selectedAchv.trigger.imageUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedAchv.trigger.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-md scale-110" />
                    ) : (
                        <Coffee size={32} className="text-text-muted" strokeWidth={1.8} />
                    )}
                 </div>
                 <div className="flex-1 flex flex-col justify-center items-start text-left">
                    {/* 1. 顶部：关键见证者 + 品牌名联合显示 */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                       <span className="text-[10px] text-text-muted font-bold tracking-widest">关键见证者</span>
                       {selectedAchv.trigger.brand && (
                         <>
                           <span className="text-[10px] text-border-main/80">|</span>
                           <span className="text-[10px] font-bold text-[#8E7558]">{selectedAchv.trigger.brand}</span>
                         </>
                       )}
                    </div>
                    
                    {/* 2. 中间：饮品名独占一行，去掉 truncate 限制，允许长名字自动换行 */}
                    <div className="font-black text-[15px] text-text-main leading-snug mb-2 w-full break-words whitespace-normal line-clamp-2">
                       {selectedAchv.trigger.type}
                    </div>
                    
                    {/* 3. 底部：规格标签 */}
                    <div className="text-[10px] text-[#8E7558] font-medium bg-[#8E7558]/10 px-2 py-0.5 rounded-md">
                       {selectedAchv.trigger.size || '中杯'} · {selectedAchv.trigger.temperature || '正常冰'} · {selectedAchv.trigger.sweetness || '标准糖'}
                    </div>
                 </div>
              </div>

              {/* 毒舌/治愈评语 */}
              <p className="text-[14px] text-text-main leading-relaxed font-medium mb-8 relative z-10 opacity-90">
                {selectedAchv.buildText(selectedAchv.trigger).comment}
              </p>

              <button 
                onClick={handleShareAchievement} // 👈 替换掉原来的演示代码
                className="w-full bg-gradient-to-r from-[#8E7558] to-[#A58E72] text-white py-3.5 rounded-full font-bold shadow-[0_8px_20px_rgba(142,117,88,0.3)] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2"
              >
                <Share size={18} /> {/* 加上这个图标会让按钮更精致 */}
                分享我的高光时刻
              </button>

              <button 
                onClick={() => setSelectedAchv(null)} 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg-input/80 flex items-center justify-center text-text-muted hover:text-text-main transition-colors z-20"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        {/* 🌟 全局历史与搜索弹窗 */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed inset-0 z-[120] bg-bg-app flex flex-col sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-bg-card z-20">
              <h2 className="text-3xl font-black text-text-main tracking-tight">
                {prefLanguage === 'English' ? 'History' : '所有记录'}
              </h2>
              <button onClick={() => { setShowHistoryModal(false); setSearchQuery(''); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors shadow-sm">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Sticky 搜索框 */}
            <div className="px-5 py-4 bg-bg-card shadow-[0_8px_20px_rgba(0,0,0,0.02)] z-10 sticky top-0 border-b border-border-main/30">
               <div className="relative">
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                 <input
                   type="text"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder={prefLanguage === 'English' ? "Search brand or name..." : "搜索品牌或饮品名称..."}
                   className="w-full bg-bg-input rounded-2xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7558]/30 transition-all font-bold text-text-main placeholder:font-medium"
                 />
                 {searchQuery && (
                   <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main bg-bg-card rounded-full p-0.5 shadow-sm">
                     <X size={14} strokeWidth={2.5} />
                   </button>
                 )}
               </div>
            </div>

           {/* 结果列表 (时间轴版) */}
            <div className="flex-1 overflow-y-auto px-5 py-6 custom-scrollbar bg-bg-app relative">
              {(() => {
                // 过滤和排序逻辑：按时间倒序排列
                const filtered = records.filter(r => {
                  const q = searchQuery.toLowerCase();
                  return (r.brand || '').toLowerCase().includes(q) || (r.type || '').toLowerCase().includes(q);
                }).sort((a, b) => {
                  const dateA = new Date(a.year, a.month, a.day).getTime();
                  const dateB = new Date(b.year, b.month, b.day).getTime();
                  if (dateB !== dateA) return dateB - dateA;
                  return parseInt(b.id) - parseInt(a.id); // 保证同一天的也是最新的在最上面
                });

                if (filtered.length === 0) {
                   return (
                     <div className="flex flex-col items-center justify-center py-20 opacity-50">
                       <Coffee size={48} className="text-text-muted mb-4" strokeWidth={1.5} />
                       <p className="text-text-muted text-sm font-bold tracking-widest">
                         {prefLanguage === 'English' ? 'NO RECORDS FOUND' : '没有找到相关记录'}
                       </p>
                     </div>
                   )
                }

                let lastMonthStr = "";

                return (
                  <div className="relative">
                    {/* 贯穿全局的垂直时间线 */}
                    <div className="absolute left-[15px] top-2 bottom-4 w-[2px] bg-border-main/70"></div>

                    <div className="space-y-6">
                      {filtered.map((record) => {
                        const currentMonthStr = `${record.year}年${record.month + 1}月`;
                        const showMonthHeader = currentMonthStr !== lastMonthStr;
                        lastMonthStr = currentMonthStr;

                        return (
                          <React.Fragment key={record.id}>
                            {/* 月份时间节点分隔符 */}
                            {showMonthHeader && (
                              <div className="relative pl-10 pt-2 pb-1">
                                <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-bg-app border-[2px] border-text-muted z-10"></div>
                                <span className="text-xs font-black text-text-muted tracking-widest bg-bg-app px-2 py-1 rounded-full border border-border-main/50">
                                  {currentMonthStr}
                                </span>
                              </div>
                            )}

                            {/* 单条记录卡片 */}
                            <div
                              onClick={() => {
                                 setShowHistoryModal(false);
                                 openEditModal(record);
                              }}
                              className="relative pl-10 cursor-pointer group"
                            >
                              {/* 时间轴上的圆点 (品牌专属色或主题色) */}
                              <div
                                className="absolute left-[11px] top-[28px] w-2.5 h-2.5 rounded-full ring-4 ring-bg-app z-10 transition-transform group-hover:scale-150"
                                style={{ backgroundColor: getBrandColor(record.brand || '') || themeAccent }}
                              ></div>

                              {/* 卡片主体 */}
                              <div className="bg-bg-card rounded-[24px] p-3.5 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border-main/40 group-hover:border-[#8E7558]/50 group-hover:shadow-md transition-all">
                                
                                {/* 左侧：日期与贴纸 */}
                                <div className="flex flex-col items-center justify-center shrink-0 w-12">
                                  <span className="text-[10px] font-black text-text-muted mb-1 font-mono tracking-tighter">
                                    {String(record.month + 1).padStart(2, '0')}/{String(record.day).padStart(2, '0')}
                                  </span>
                                  <div className="w-12 h-14 flex items-center justify-center relative">
                                    {isExportableImageSrc(record.imageUrl) ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={record.imageUrl} alt="drink" className="w-full h-full object-contain filter drop-shadow-sm scale-110" />
                                    ) : (
                                      <Coffee size={28} className="text-text-muted" strokeWidth={1.8} />
                                    )}
                                  </div>
                                </div>

                                {/* 右侧：详细信息 */}
                                <div className="flex-1 min-w-0 py-1">
                                  <div className="flex justify-between items-start mb-1.5">
                                    <h3 className="font-black text-text-main text-[16px] leading-tight truncate pr-2">{record.type}</h3>
                                    <span className="font-black text-[#8E7558] text-[16px] shrink-0">￥{record.cost}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    {record.brand && (
                                      <span 
                                        className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" 
                                        style={{ backgroundColor: getBrandColor(record.brand) || themeAccent }}
                                      >
                                        {record.brand}
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-text-muted font-medium flex gap-2">
                                    <span>{record.size || '中杯'}</span>
                                    <span>{record.temperature || '正常冰'}</span>
                                    <span>{record.sweetness || '标准糖'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleCapture}
      />

      {/* 👉 优雅的全局 Toast 提示 */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl backdrop-blur-xl font-medium text-sm border"
            style={{
              backgroundColor: toastMsg.type === 'error' ? 'rgba(254, 226, 226, 0.95)' : isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              color: toastMsg.type === 'error' ? '#991B1B' : isDark ? '#ffffff' : '#102a4a',
              borderColor: toastMsg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
            }}
          >
            {toastMsg.type === 'error' ? '⚠️' : toastMsg.type === 'info' ? '💡' : '✨'}
            {toastMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-card/80 backdrop-blur-xl border border-border-main/80 rounded-full px-2 py-2 flex items-center gap-2 z-50 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'home' ? 'bg-bg-input text-[#8E7558] shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}
        >
          <Coffee size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'stats' ? 'bg-bg-input text-[#8E7558] shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}
        >
          <BarChart3 size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center w-20 h-12 rounded-full transition-all duration-300 ${activeTab === 'settings' ? 'bg-bg-input text-[#8E7558] shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-bg-input/50'}`}
        >
          <SettingsIcon size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
        </button>
      </div>

   {/* 👇 将这里的样式替换为“彻底隐藏滚动条”的终极兼容代码 */}
      <style dangerouslySetInnerHTML={{__html: `
        /* 隐藏 Chrome, Safari 和 Opera 的滚动条 */
        .custom-scrollbar::-webkit-scrollbar { 
          display: none; 
          width: 0px; 
        }
        /* 隐藏 IE, Edge 和 Firefox 的滚动条 */
        .custom-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}} />
    </div>
  );
}