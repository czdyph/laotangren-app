"use client";

import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Edit2, Share, Trash2 } from 'lucide-react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onEdit: () => void;
    onShare: () => void;
    onDelete: () => void;
    triggerHaptic: (style: any) => void;
}

export default function SwipeableItem({ children, onEdit, onShare, onDelete, triggerHaptic }: SwipeableItemProps) {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);

    // 🚀 核心：根据滑动距离，动态映射底层背景的透明度和颜色
    const rightBgOpacity = useTransform(x, [0, -60], [0, 1]);
    const leftBgOpacity = useTransform(x, [0, 60], [0, 1]);
    
    // 向右滑时：短距离是编辑(蓝色)，长距离是分享(紫色)
    const leftIconType = useTransform(x, (val) => val > window.innerWidth * 0.4 ? 'share' : 'edit');
    const leftBgColor = useTransform(x, [60, window.innerWidth * 0.4], ['#3B82F6', '#8B5CF6']);

    const handleDragEnd = (event: any, info: any) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const width = window.innerWidth;

        // 1. 左滑 (删除)
        if (offset < -width * 0.6 || (offset < -80 && velocity < -500)) {
            triggerHaptic('heavy');
            // 滑出屏幕
            controls.start({ x: -width, opacity: 0, transition: { duration: 0.2 } }).then(() => {
                onDelete();
            });
        } 
        // 2. 右滑深滑 (分享)
        else if (offset > width * 0.4 || (offset > 120 && velocity > 500)) {
            triggerHaptic('success');
            // 弹回原位并触发分享
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0.5 } });
            onShare();
        } 
        // 3. 右滑浅滑 (露出编辑按钮)
        else if (offset > 60) {
            triggerHaptic('light');
            // 吸附在 80px 的位置
            controls.start({ x: 80, transition: { type: 'spring', bounce: 0.4 } });
        } 
        // 4. 其他情况 (回弹)
        else {
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0.5 } });
        }
    };

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-[24px] mb-4">
            {/* 🛑 底层背景：左滑(删除)的红色背景 */}
            <motion.div 
                style={{ opacity: rightBgOpacity }}
                className="absolute inset-y-0 right-0 w-full bg-red-500 rounded-[24px] flex items-center justify-end px-8"
            >
                <Trash2 className="text-white w-6 h-6" strokeWidth={2.5} />
            </motion.div>

            {/* 🔵 底层背景：右滑(编辑/分享)的动态背景 */}
            <motion.div 
                style={{ opacity: leftBgOpacity, backgroundColor: leftBgColor }}
                className="absolute inset-y-0 left-0 w-full rounded-[24px] flex items-center justify-start px-8"
            >
                <motion.div className="flex items-center text-white font-bold gap-2">
                    <Edit2 className="w-5 h-5" strokeWidth={2.5} style={{ display: x.get() > window.innerWidth * 0.4 ? 'none' : 'block' }} />
                    <Share className="w-5 h-5" strokeWidth={2.5} style={{ display: x.get() > window.innerWidth * 0.4 ? 'block' : 'none' }} />
                </motion.div>
            </motion.div>

            {/* ✨ 前景卡片：真实的滑动刚体 */}
            <motion.div
                drag="x"
                dragDirectionLock
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.8, right: 0.8 }} // 极具质感的皮筋阻尼
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x }}
                className="relative z-10 w-full bg-bg-app rounded-[24px]"
            >
                {/* 暴露编辑按钮吸附状态下的点击区 */}
                {children}

                {/* 吸附在编辑状态时，点击左侧空隙也能触发编辑并收回 */}
                <div 
                    className="absolute inset-y-0 left-[-80px] w-[80px] z-20 cursor-pointer"
                    onClick={() => {
                        onEdit();
                        controls.start({ x: 0 });
                    }}
                />
            </motion.div>
        </div>
    );
}