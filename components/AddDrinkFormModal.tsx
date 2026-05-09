"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// 🚀 引入了日历需要的图标
import { Coffee, X, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { DrinkRecord } from "@/types";
import {
    getBrandKey,
    getBrandLogoFile,
    getSweetnessOptions,
    compressImage,
    isExportableImageSrc
} from "@/utils/helpers";

interface AddDrinkFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (record: DrinkRecord, isEditing: boolean) => void;
    editingRecord: DrinkRecord | null;
    currentDate: Date | null;
    selectedDay: number | null;
    defaultTemp: string;
    defaultSweet: string;
    triggerHaptic: (style?: any) => void;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AddDrinkFormModal({
    isOpen, onClose, onSave, editingRecord,
    currentDate, selectedDay, defaultTemp, defaultSweet,
    triggerHaptic, showToast
}: AddDrinkFormModalProps) {

    const [draftImage, setDraftImage] = useState<string>('??');
    const [draftDate, setDraftDate] = useState<string>('');
    const [draftBrand, setDraftBrand] = useState('');
    const [draftName, setDraftName] = useState('');
    const [draftCost, setDraftCost] = useState('');
    const [draftSize, setDraftSize] = useState('中杯');
    const [draftTemperature, setDraftTemperature] = useState('正常冰');
    const [draftSweetness, setDraftSweetness] = useState('标准糖');

    // 🚀 新增：自建折叠日历的状态
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarViewDate, setCalendarViewDate] = useState(new Date());

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 监听品牌变化，自动匹配 Logo 和修正甜度选项
    useEffect(() => {
        setDraftImage(prevImage => {
            const isRealPhoto = prevImage && prevImage !== '??' && !prevImage.includes('/logos/');
            if (isRealPhoto) return prevImage;
            const logoFile = getBrandLogoFile(draftBrand);
            return logoFile ? `/logos/${logoFile}` : '??';
        });

        setDraftSweetness(prevSweet => {
            const options = getSweetnessOptions(draftBrand);
            if (!options.includes(prevSweet) && draftBrand.length > 0) {
                return options[options.length - 1];
            }
            return prevSweet;
        });
    }, [draftBrand]);

    useEffect(() => {
        if (isOpen) {
            setIsCalendarOpen(false); // 每次打开弹窗时收起日历
            if (editingRecord) {
                setDraftImage(editingRecord.imageUrl);
                setDraftBrand(editingRecord.brand || '');
                setDraftName(editingRecord.type);
                setDraftCost(editingRecord.cost.toString());
                setDraftSize(editingRecord.size || '中杯');
                setDraftTemperature(editingRecord.temperature || '正常冰');
                setDraftSweetness(editingRecord.sweetness || '标准糖');
                const y = editingRecord.year;
                const m = String(editingRecord.month + 1).padStart(2, '0');
                const d = String(editingRecord.day).padStart(2, '0');
                setDraftDate(`${y}-${m}-${d}`);
                setCalendarViewDate(new Date(y, editingRecord.month, editingRecord.day));
            } else {
                setDraftImage('??');
                setDraftBrand('');
                setDraftName('');
                setDraftCost('');
                setDraftSize('中杯');
                setDraftTemperature(defaultTemp);
                setDraftSweetness(defaultSweet);
                const y = currentDate ? currentDate.getFullYear() : new Date().getFullYear();
                const m = String((currentDate ? currentDate.getMonth() : new Date().getMonth()) + 1).padStart(2, '0');
                const d = String(selectedDay || (currentDate ? currentDate.getDate() : new Date().getDate())).padStart(2, '0');
                setDraftDate(`${y}-${m}-${d}`);
                setCalendarViewDate(new Date(y, parseInt(m) - 1, parseInt(d)));
            }
        }
    }, [isOpen, editingRecord, currentDate, selectedDay, defaultTemp, defaultSweet]);

    const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const imageUrl = await compressImage(file);
            setDraftImage(imageUrl);
        } catch (error) {
            console.error("Image capture failed:", error);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = () => {
        if (!draftDate) {
            showToast("请选择有效日期", "error");
            return;
        }
        const [dYear, dMonth, dDay] = draftDate.split('-').map(Number);
        const newRecord: DrinkRecord = {
            id: editingRecord ? editingRecord.id : Date.now().toString(),
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
        onSave(newRecord, !!editingRecord);
    };

    const toggleCalendar = () => {
        if (!isCalendarOpen && draftDate) {
            const [y, m, d] = draftDate.split('-').map(Number);
            setCalendarViewDate(new Date(y, m - 1, d));
        }
        setIsCalendarOpen(!isCalendarOpen);
        triggerHaptic('light');
    };

    // 🚀 构建日历网格数据
    const cYear = calendarViewDate.getFullYear();
    const cMonth = calendarViewDate.getMonth();
    const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
    let firstDay = new Date(cYear, cMonth, 1).getDay();
    // 假设周一为每周第一天，适配你的系统习惯（如果想周日开始，这里直接用 firstDay 即可）
    firstDay = firstDay === 0 ? 6 : firstDay - 1; 
    
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const today = new Date();

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="w-full bg-bg-card rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative sm:max-w-[400px] max-h-[92vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex flex-col items-center pt-3 pb-4 px-6 bg-bg-card z-20 shrink-0 border-b border-border-main/40 shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
                            <div className="w-12 h-1.5 bg-border-main rounded-full mb-4"></div>
                            <div className="flex justify-between items-center w-full">
                                <h2 className="text-[20px] font-black text-text-main tracking-tight">{editingRecord ? '编辑奶茶' : '记录新奶茶'}</h2>
                                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors active:scale-95">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6 bg-bg-app/30">
                            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 mx-auto bg-bg-input rounded-[22px] flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0 shadow-inner group ring-4 ring-bg-app">
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
                            </div>

                            <div className="space-y-4">
                                
                                {/* 🚀 极致优雅的定制化折叠日历 */}
                                <div className="flex flex-col">
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">日期 / Date</label>
                                    <button
                                        onClick={toggleCalendar}
                                        className={`w-full bg-bg-card rounded-2xl px-4 py-3.5 flex items-center justify-between text-[15px] focus:outline-none transition-all font-bold shadow-sm border ${isCalendarOpen ? 'border-transparent theme-ring ring-2 text-text-main' : 'border-border-main/50 text-text-main'}`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <CalendarDays size={18} className={isCalendarOpen ? 'theme-text' : 'text-text-muted'} />
                                            <span>{draftDate.replace(/-/g, ' / ')}</span>
                                        </div>
                                        <ChevronRight size={18} className={`text-text-muted transition-transform duration-300 ${isCalendarOpen ? 'rotate-90 theme-text' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isCalendarOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
                                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 bg-bg-input/50 rounded-2xl border border-border-main/50">
                                                    {/* Calendar Header */}
                                                    <div className="flex items-center justify-between mb-4 px-1">
                                                        <button onClick={(e) => { e.preventDefault(); setCalendarViewDate(new Date(cYear, cMonth - 1, 1)); triggerHaptic('light'); }} className="p-1.5 hover:bg-bg-card rounded-full transition-colors"><ChevronLeft size={16} className="text-text-muted" /></button>
                                                        <span className="text-[13px] font-black text-text-main tracking-wider">{cYear}年 {cMonth + 1}月</span>
                                                        <button onClick={(e) => { e.preventDefault(); setCalendarViewDate(new Date(cYear, cMonth + 1, 1)); triggerHaptic('light'); }} className="p-1.5 hover:bg-bg-card rounded-full transition-colors"><ChevronRight size={16} className="text-text-muted" /></button>
                                                    </div>
                                                    {/* Days Header */}
                                                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-black text-text-muted/60">
                                                        {['一', '二', '三', '四', '五', '六', '日'].map(d => <div key={d}>{d}</div>)}
                                                    </div>
                                                    {/* Days Grid */}
                                                    <div className="grid grid-cols-7 gap-1.5 text-center">
                                                        {blanks.map(b => <div key={`blank-${b}`} />)}
                                                        {days.map(d => {
                                                            const dateStr = `${cYear}-${String(cMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                            const isSelected = draftDate === dateStr;
                                                            const isToday = today.getFullYear() === cYear && today.getMonth() === cMonth && today.getDate() === d;
                                                            return (
                                                                <button
                                                                    key={d}
                                                                    onClick={(e) => { e.preventDefault(); setDraftDate(dateStr); setIsCalendarOpen(false); triggerHaptic('medium'); }}
                                                                    className={`aspect-square flex items-center justify-center rounded-xl text-[12px] font-bold transition-all
                                                                        ${isSelected ? 'theme-bg text-white shadow-md scale-105' :
                                                                          isToday ? 'bg-bg-card theme-text ring-1 theme-ring' :
                                                                          'text-text-main hover:bg-bg-card border border-transparent'}`}
                                                                >
                                                                    {d}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">品牌 / Brand</label>
                                    <input type="text" value={draftBrand} onChange={e => { const val = e.target.value; setDraftBrand(getBrandKey(val) || val); }} placeholder="例如：霸王茶姬" className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 theme-ring transition-all font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium shadow-sm border border-border-main/50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">名称 / Name</label>
                                    <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="例如：伯牙绝弦" className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 theme-ring transition-all font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium shadow-sm border border-border-main/50" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">价格 / Price</label>
                                    <div className="relative flex items-center shadow-sm rounded-2xl border border-border-main/50 bg-bg-card focus-within:ring-2 theme-ring transition-all">
                                        <span className="absolute left-4 text-text-muted font-black text-lg">￥</span>
                                        <input type="number" value={draftCost} onChange={e => setDraftCost(e.target.value)} placeholder="20" className="w-full bg-transparent rounded-2xl pl-10 pr-4 py-3.5 text-[15px] focus:outline-none font-bold text-text-main placeholder:text-text-muted/40 placeholder:font-medium" />
                                    </div>
                                </div>
                                <div className="pt-4 mt-2 border-t border-border-main/60 space-y-5">
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">杯型 / Size</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {['中杯', '大杯', '超大杯'].map(size => (
                                                <button key={size} onClick={() => {setDraftSize(size); triggerHaptic('light');}} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSize === size ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{size}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">温度 / Temp</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {['热', '正常冰', '少冰', '去冰'].map(temp => (
                                                <button key={temp} onClick={() => {setDraftTemperature(temp); triggerHaptic('light');}} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftTemperature === temp ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{temp}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">甜度 / Sweet</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {getSweetnessOptions(draftBrand).map(sweet => (
                                                <button key={sweet} onClick={() => {setDraftSweetness(sweet); triggerHaptic('light');}} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSweetness === sweet ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{sweet}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 pt-4 bg-bg-card border-t border-border-main/40 shrink-0 z-20">
                            <button onClick={handleSubmit} className="w-full theme-gradient text-white py-4 rounded-full text-[16px] font-bold theme-shadow active:scale-95 transition-transform flex justify-center items-center gap-2">
                                <span>保存记录</span>
                            </button>
                        </div>

                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleCapture} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}