"use client";

import React from "react";
import { motion } from "framer-motion";
import { Coffee, BarChart3, Settings as SettingsIcon } from "lucide-react";

interface GooeyTabBarProps {
    activeTab: 'home' | 'stats' | 'settings';
    setActiveTab: (tab: 'home' | 'stats' | 'settings') => void;
    triggerHaptic: (style: any) => void;
}

export default function GooeyTabBar({ activeTab, setActiveTab, triggerHaptic }: GooeyTabBarProps) {
    const tabs = [
        { id: 'home', icon: Coffee },
        { id: 'stats', icon: BarChart3 },
        { id: 'settings', icon: SettingsIcon },
    ] as const;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="relative flex items-center bg-bg-card/90 backdrop-blur-xl p-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border-main/50">
                <div className="relative flex items-center gap-0 z-10">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (activeTab !== tab.id) triggerHaptic('light');
                                    setActiveTab(tab.id);
                                }}
                                // 🌟 父级 relative，提供绝佳的物理容器
                                className={`relative flex items-center justify-center w-20 h-12 rounded-full transition-colors duration-300 active:scale-95 ${
                                    isActive ? "text-white" : "text-text-muted hover:text-text-main"
                                }`}
                            >
                                {/* 🚀 Framer Motion 的 LayoutId 魔法：自动智能吸附，告别所有数学计算 */}
                                {isActive && (
                                    <motion.div
                                        layoutId="tab-indicator"
                                        className="absolute inset-0 rounded-full theme-bg shadow-sm"
                                        transition={{
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 25,
                                            mass: 0.8
                                        }}
                                    />
                                )}
                                
                                {/* 🌟 图标层级提升，保证永远在背景快上方 */}
                                <span className="relative z-10 flex items-center justify-center">
                                    <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}