import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Coffee } from 'lucide-react';
import { DrinkRecord } from '@/types';
import { getBrandColor, isExportableImageSrc } from '@/utils/helpers';
import { Virtuoso } from 'react-virtuoso';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: DrinkRecord[];
    prefLanguage: string;
    themeAccent: string;
    openEditModal: (record: DrinkRecord) => void;
}

export default function HistoryModal({
    isOpen, onClose, records, prefLanguage, themeAccent, openEditModal,
}: HistoryModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleClose = () => {
        setSearchQuery('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="fixed inset-0 z-[120] bg-bg-app flex flex-col sm:max-w-[420px] sm:mx-auto sm:border-x sm:border-border-main overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-4 bg-bg-card z-20">
                        <h2 className="text-3xl font-black text-text-main tracking-tight">
                            {prefLanguage === 'English' ? 'History' : '所有记录'}
                        </h2>
                        <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-input text-text-muted hover:text-text-main transition-colors shadow-sm">
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Sticky 搜索框 */}
                    <div className="px-5 py-4 bg-bg-card shadow-[0_8px_20px_rgba(0,0,0,0.02)] z-20 border-b border-border-main/30 relative">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={prefLanguage === 'English' ? 'Search brand or name...' : '搜索品牌或饮品名称...'}
                                className="w-full bg-bg-input rounded-2xl pl-12 pr-10 py-3.5 text-sm focus:outline-none focus:ring-2 focus:theme-ring/30 transition-all font-bold text-text-main placeholder:font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main bg-bg-card rounded-full p-0.5 shadow-sm">
                                    <X size={14} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 🚀 结果列表 (防爆出屏幕重构版) */}
                    <div className="flex-1 bg-bg-app relative h-full w-full overflow-hidden">
                        {(() => {
                            const filtered = records
                                .filter((r) => {
                                    const q = searchQuery.toLowerCase();
                                    return (r.brand || '').toLowerCase().includes(q) || (r.type || '').toLowerCase().includes(q);
                                })
                                .sort((a, b) => {
                                    const dateA = new Date(a.year, a.month, a.day).getTime();
                                    const dateB = new Date(b.year, b.month, b.day).getTime();
                                    if (dateB !== dateA) return dateB - dateA;
                                    return parseInt(b.id) - parseInt(a.id);
                                });

                            if (filtered.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-50 h-full">
                                        <Coffee size={48} className="text-text-muted mb-4" strokeWidth={1.5} />
                                        <p className="text-text-muted text-sm font-bold tracking-widest">
                                            {prefLanguage === 'English' ? 'NO RECORDS FOUND' : '没有找到相关记录'}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="relative h-full w-full">
                                    {/* 贯穿全局的垂直时间线 */}
                                    <div className="absolute left-[35px] top-0 bottom-0 w-[2px] bg-border-main/70 z-0 pointer-events-none"></div>

                                    {/* 🚀 核心 1：强制禁用横向滚动，移除 px-5 */}
                                    <Virtuoso
                                        style={{ height: '100%', width: '100%', overflowX: 'hidden' }}
                                        data={filtered}
                                        className="custom-scrollbar"
                                        itemContent={(index, record) => {
                                            const currentMonthStr = `${record.year}年${record.month + 1}月`;
                                            const previousRecord = index > 0 ? filtered[index - 1] : null;
                                            const showMonthHeader = !previousRecord || `${previousRecord.year}年${previousRecord.month + 1}月` !== currentMonthStr;

                                            return (
                                                <div className="pb-6 pt-1 relative z-10 px-5 w-full box-border">
                                                    {/* 月份时间节点分隔符 */}
                                                    {showMonthHeader && (
                                                        <div className="relative pl-10 pb-3 pt-1">
                                                            <div className="absolute left-[11px] top-[14px] -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-bg-app border-[2px] border-text-muted z-10"></div>
                                                            <span className="text-xs font-black text-text-muted tracking-widest bg-bg-app px-2 py-1 rounded-full border border-border-main/50">
                                                                {currentMonthStr}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* 单条记录卡片 */}
                                                    <div
                                                        onClick={() => { onClose(); openEditModal(record); }}
                                                        className="relative pl-10 cursor-pointer group w-full"
                                                    >
                                                        {/* 时间轴上的圆点 */}
                                                        <div
                                                            className="absolute left-[11px] top-[28px] w-2.5 h-2.5 rounded-full ring-4 ring-bg-app z-10 transition-transform group-hover:scale-150"
                                                            style={{ backgroundColor: getBrandColor(record.brand || '') || themeAccent }}
                                                        ></div>

                                                        {/* 🚀 核心 3：w-full 配合 overflow-hidden 把卡片锁死在可用空间内 */}
                                                        <div className="bg-bg-card w-full overflow-hidden rounded-[24px] p-3.5 flex items-center gap-3 sm:gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-border-main/40 group-hover:theme-border group-hover:shadow-md transition-all">
                                                            <div className="flex flex-col items-center justify-center shrink-0 w-11 sm:w-12">
                                                                <span className="text-[10px] font-black text-text-muted mb-1 font-mono tracking-tighter">
                                                                    {String(record.month + 1).padStart(2, '0')}/{String(record.day).padStart(2, '0')}
                                                                </span>
                                                                <div className="w-11 h-12 sm:w-12 sm:h-14 flex items-center justify-center relative">
                                                                    {isExportableImageSrc(record.imageUrl) ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={record.imageUrl} alt="drink" loading="lazy" decoding="async" className="w-full h-full object-contain filter drop-shadow-sm scale-110" />
                                                                    ) : (
                                                                        <Coffee size={28} className="text-text-muted" strokeWidth={1.8} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex-1 min-w-0 py-1">
                                                                {/* 🚀 核心 4：去掉这层的 w-full，避免计算溢出，搭配 break-all 实现绝对安全换行 */}
                                                                <div className="flex justify-between items-start mb-1.5 gap-2">
                                                                    <h3 className="font-black text-text-main text-[15px] sm:text-[16px] leading-snug flex-1 min-w-0 break-all whitespace-normal">
                                                                        {record.type}
                                                                    </h3>
                                                                    <span className="font-black theme-text text-[15px] sm:text-[16px] shrink-0 mt-px whitespace-nowrap">
                                                                        ￥{record.cost}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                                    {record.brand && (
                                                                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: getBrandColor(record.brand) || themeAccent }}>
                                                                            {record.brand}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="text-[11px] text-text-muted font-medium flex flex-wrap gap-1.5 sm:gap-2">
                                                                    <span className="shrink-0">{record.size || '中杯'}</span>
                                                                    <span className="shrink-0">{record.temperature || '正常冰'}</span>
                                                                    <span className="shrink-0">{record.sweetness || '标准糖'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}