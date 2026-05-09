import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coffee } from 'lucide-react';
import { DrinkRecord } from '../types';
import { getBrandLogoFile, isExportableImageSrc } from '../utils/helpers';

interface SingleReceiptModalProps {
    shareRecord: DrinkRecord | null;
    setShareRecord: (record: DrinkRecord | null) => void;
    prefLanguage: string;
    singleReceiptRef: React.RefObject<HTMLDivElement | null>;
    handleSaveReceipt: (ref: React.RefObject<HTMLDivElement | null>) => void;
    handleShareReceipt: (ref: React.RefObject<HTMLDivElement | null>) => void;
}

export default function SingleReceiptModal({
    shareRecord,
    setShareRecord,
    prefLanguage,
    singleReceiptRef,
    handleSaveReceipt,
    handleShareReceipt
}: SingleReceiptModalProps) {
    if (!shareRecord) return null;

return (
        <AnimatePresence>
            {/* 🚀 外层：黑色蒙层，绝对静止，只负责透明度渐变 */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] bg-[#1a1a1e]/95 overflow-y-auto custom-scrollbar backdrop-blur-md"
            >
                {/* 🚀 内层：内容容器，接管手势拖拽和向右飞出 */}
                <motion.div 
                    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} 
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: 0, right: 0.8 }}
                    onDragEnd={(e, info) => { if (info.offset.x > 100 || info.velocity.x > 500) setShareRecord(null); }}
                    className="min-h-full flex flex-col items-center justify-center py-12 px-4 w-full"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                        ref={singleReceiptRef}
                        className="bg-[#f8f8f8] w-full max-w-[360px] rounded-t-2xl relative flex flex-col pt-7 pb-4 px-6 text-gray-800 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
                    >
                        {/* 顶部抬头：品牌 Logo 居中显示 */}
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

                        <div className="border-b-[3px] border-[#102a4a] mb-6 w-full"></div>

                        {/* 主体区：饮品名称(左) + 奶茶实拍贴纸(右) */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex-1 pr-4 pt-2">
                                <h1 className="text-[36px] font-black tracking-tight leading-[1.1] mb-2 text-[#102a4a] break-words">
                                    {shareRecord.type || '今日奶茶'}
                                </h1>
                                <div className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
                                    NO.{shareRecord.id}
                                </div>
                            </div>

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

                        <div className="flex justify-center h-11 opacity-80 mb-1">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div key={i} className={`h-full bg-black mx-[0.5px] ${i % 3 === 0 ? 'w-1' : i % 5 === 0 ? 'w-1.5' : 'w-[2px]'}`}></div>
                            ))}
                        </div>

                        <div className="absolute -bottom-[6px] left-0 right-0 h-3 flex justify-around px-1 overflow-hidden pointer-events-none">
                            {Array.from({ length: 30 }).map((_, i) => (
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

                    <motion.button initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} onClick={() => setShareRecord(null)} className="mt-8 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center font-bold text-xl pb-1 shadow-lg hover:bg-gray-100 transition-colors shrink-0">
                        <X size={22} strokeWidth={2.5} />
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}