"use client";

import React, { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface NumberTickerProps {
    value: number;
    isCurrency?: boolean;
    className?: string;
}

export default function NumberTicker({ value, isCurrency = false, className = "" }: NumberTickerProps) {
    // 🚀 核心：使用物理弹簧模拟真实的机械齿轮阻尼感
    const springValue = useSpring(0, {
        mass: 0.8,
        stiffness: 150,
        damping: 20
    });

    // 每次 value 变化时，触发弹簧滚动
    useEffect(() => {
        springValue.set(value);
    }, [springValue, value]);

    // 将滚动的浮点数格式化为金额（带1位小数）或整数杯数
    const displayValue = useTransform(springValue, (current) => {
        if (isCurrency) {
            return current.toFixed(1);
        }
        return Math.round(current).toString();
    });

    return <motion.span className={className}>{displayValue}</motion.span>;
}