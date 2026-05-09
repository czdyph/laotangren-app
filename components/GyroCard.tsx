"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface GyroCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function GyroCard({ children, className = "" }: GyroCardProps) {
    // 1. 记录物理倾斜角度的原始值
    const rawX = useMotionValue(0); // 左右倾斜 (Gamma)
    const rawY = useMotionValue(0); // 前后倾斜 (Beta)

    // 2. 注入物理弹簧，消除安卓陀螺仪高频采样的抖动感
    const smoothX = useSpring(rawX, { damping: 25, stiffness: 120, mass: 0.5 });
    const smoothY = useSpring(rawY, { damping: 25, stiffness: 120, mass: 0.5 });

    // 3. 将倾斜角度映射为 3D 旋转角度 (限制最大旋转范围为 ±15度)
    const rotateY = useTransform(smoothX, [-45, 45], [-15, 15]);
    // 安卓手机平扫时，Beta 基准角度大约在 45~60 度之间
    const rotateX = useTransform(smoothY, [20, 80], [15, -15]); 

    // 4. 将倾斜角度映射为镭射反光层的移动轨迹
    const glareX = useTransform(smoothX, [-45, 45], ["-50%", "150%"]);
    const glareY = useTransform(smoothY, [20, 80], ["-50%", "150%"]);

    useEffect(() => {
        // 直接接管原生设备方向事件
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null) rawX.set(e.gamma);
            if (e.beta !== null) rawY.set(e.beta);
        };

        window.addEventListener("deviceorientation", handleOrientation, true);
        return () => window.removeEventListener("deviceorientation", handleOrientation, true);
    }, [rawX, rawY]);

    return (
        <div className={`relative perspective-[1200px] ${className}`}>
            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                }}
                className="w-full h-full relative"
            >
                {/* 内容层 */}
                {children}

                {/* ✨ 镭射全息高光层：随重力流动的渐变色 */}
                <motion.div
                    className="absolute inset-0 z-50 pointer-events-none rounded-3xl"
                    style={{
                        background: "radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)",
                        left: glareX,
                        top: glareY,
                        width: "150%",
                        height: "150%",
                        transform: "translate(-25%, -25%)",
                        mixBlendMode: "overlay",
                    }}
                />
            </motion.div>
        </div>
    );
}