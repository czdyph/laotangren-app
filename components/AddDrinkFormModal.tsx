"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X } from "lucide-react";

// 引入刚才抽离的类型和工具函数
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

    // 🌟 表单专属状态（不会再去污染外层的 page.tsx 了）
    const [draftImage, setDraftImage] = useState<string>('??');
    const [draftDate, setDraftDate] = useState<string>('');
    const [draftBrand, setDraftBrand] = useState('');
    const [draftName, setDraftName] = useState('');
    const [draftCost, setDraftCost] = useState('');
    const [draftSize, setDraftSize] = useState('中杯');
    const [draftTemperature, setDraftTemperature] = useState('正常冰');
    const [draftSweetness, setDraftSweetness] = useState('标准糖');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isUploadedImage = draftImage.startsWith('blob:') || draftImage.startsWith('data:');
        if (!isUploadedImage) {
            const logoFile = getBrandLogoFile(draftBrand);
            if (logoFile) {
                const logoPath = `/logos/${logoFile}`;
                if (draftImage !== logoPath) setDraftImage(logoPath);
            } else {
                if (draftImage.length > 2 && !draftImage.startsWith('/logos/')) setDraftImage('??');
                else if (!getBrandKey(draftBrand) && !draftImage.startsWith('/logos/')) setDraftImage('??');
            }
        }
        const options = getSweetnessOptions(draftBrand);
        if (!options.includes(draftSweetness) && draftBrand.length > 0) {
            setDraftSweetness(options[options.length - 1]);
        }
    }, [draftBrand, draftImage, draftSweetness]);

    useEffect(() => {
        if (isOpen) {
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
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5 ml-1 tracking-widest uppercase">日期 / Date</label>
                                    <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} className="w-full bg-bg-card rounded-2xl px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 theme-ring transition-all font-bold text-text-main shadow-sm border border-border-main/50" />
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
                                                <button key={size} onClick={() => setDraftSize(size)} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSize === size ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{size}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">温度 / Temp</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {['热', '正常冰', '少冰', '去冰'].map(temp => (
                                                <button key={temp} onClick={() => setDraftTemperature(temp)} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftTemperature === temp ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{temp}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-text-muted mb-2 ml-1 tracking-widest uppercase">甜度 / Sweet</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {getSweetnessOptions(draftBrand).map(sweet => (
                                                <button key={sweet} onClick={() => setDraftSweetness(sweet)} className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 ${draftSweetness === sweet ? 'theme-bg theme-shadow' : 'bg-bg-input text-text-muted hover:bg-border-main'}`}>{sweet}</button>
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