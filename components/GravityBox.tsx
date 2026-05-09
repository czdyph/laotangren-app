"use client";

import React, { useEffect, useRef, useState} from "react";
import Matter from "matter-js";
import { DrinkRecord } from "@/types";
import { isExportableImageSrc } from "@/utils/helpers";
import { Coffee } from "lucide-react";

interface GravityBoxProps {
    records: DrinkRecord[];
    triggerHaptic: (style?: any) => void;
    statPeriod?: string;
}

export default function GravityBox({ records, triggerHaptic, statPeriod }: GravityBoxProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [engineReady, setEngineReady] = useState(false);
    // 🚀 与外部保持 100% 绝对一致的计算逻辑
    const count = records.length;
    let stickerScale = 1;
    if (count > 80) stickerScale = 0.28;
    else if (count > 40) stickerScale = 0.4;
    else if (count > 20) stickerScale = 0.45;
    else if (count > 10) stickerScale = 0.65;
    else if (count > 5) stickerScale = 0.8;

    const baseWidth = 64;
    const baseHeight = 80;
    const stickerWidth = baseWidth * stickerScale;
    const stickerHeight = baseHeight * stickerScale;

    // 🚀 核心同步：完美的白边滤镜机制
    const isMassive = statPeriod === 'year' || count > 50;
    const heavyFilter = "drop-shadow(2px 2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(0 4px 6px rgba(0,0,0,0.15))";
    const lightFilter = "drop-shadow(0 0 1px rgba(255,255,255,0.8)) drop-shadow(0 2px 4px rgba(0,0,0,0.15))";
    const activeFilter = isMassive ? lightFilter : heavyFilter;

    useEffect(() => {
        if (!containerRef.current || records.length === 0) return;

        const { Engine, Runner, World, Bodies, Mouse, MouseConstraint, Composite, Events } = Matter;
        const engine = Engine.create();
        const world = engine.world;

        // 强行获取当前卡片容器的真实宽高
        const width = containerRef.current.clientWidth || 350;
        const height = containerRef.current.clientHeight || 250;

        // 🚀 核心修复 1：把物理天花板（Ceiling）精准卡在容器顶部的 0 坐标上（厚度 100px）
        // 这样任何东西只要想往上飞，就会立刻撞在天花板上弹回来
        const wallThickness = 100;
        const wallOpts = { isStatic: true, render: { visible: false }, friction: 0.5, restitution: 0.1 };

        const ground = Bodies.rectangle(width / 2, height + wallThickness / 2, width * 2, wallThickness, wallOpts);
        const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, wallOpts);
        const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, wallOpts);
        // 顶部天花板：底边刚好在 y = 0 处
        const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width * 2, wallThickness, wallOpts);

        Composite.add(world, [ground, leftWall, rightWall, ceiling]);

        // 🚀 核心修复 2：让所有杯子诞生在容器内部（y 轴从 10 像素开始下落）
        // 通过微小的左右偏移错开，完美避免重叠爆炸
        const bodies = records.map((_, i) => {
            const cols = Math.max(2, Math.floor(width / (stickerWidth * 1.1)));
            const col = i % cols;
            const row = Math.floor(i / cols);

            // X 轴：在容器宽度内均匀分布
            const x = (col * (width / cols)) + (width / cols / 2) + (Math.random() * 4 - 2);
            // Y 轴：从容器内部上方（比如 y = 20 往下一层层排），不越出天花板
            const y = 20 + (row * (stickerHeight * 0.9));

            return Bodies.rectangle(x, y, stickerWidth, stickerHeight, {
                restitution: 0.25, // 降低一点弹性，使其堆叠更自然
                friction: 0.5,
                frictionAir: 0.02, // 增加空气阻力，下落感更丝滑
                density: 0.001,
            });
        });
        Composite.add(world, bodies);

        // 监听碰撞触发震动
        Events.on(engine, 'collisionStart', (event: any) => {
            if (event.pairs.length > 0) {
                const pair = event.pairs[0];
                const velocity = Math.abs(pair.bodyA.velocity.y) + Math.abs(pair.bodyB.velocity.y);
                if (velocity > 6) {
                    triggerHaptic('light');
                }
            }
        });

        // 每帧更新 DOM 的位置与旋转角度
        Events.on(engine, 'afterUpdate', () => {
            bodies.forEach((body, i) => {
                const el = document.getElementById(`matter-sticker-${i}`);
                if (el) {
                    el.style.transform = `translate(${body.position.x - stickerWidth / 2}px, ${body.position.y - stickerHeight / 2}px) rotate(${body.angle}rad)`;
                }
            });
        });

        // 鼠标/手指触摸拖拽
        const mouse = Mouse.create(containerRef.current);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(world, mouseConstraint);

        const runner = Runner.create();
        Runner.run(runner, engine);

        // 🚀 新增：等待两帧，确保物理引擎彻底接管坐标后，再解除隐形，杜绝闪烁
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setEngineReady(true);
            });
        });

        // 重力感应
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null && e.beta !== null) {
                const gravity = engine.gravity;
                gravity.x = Matter.Common.clamp(e.gamma / 25, -1.5, 1.5);
                const normalizedBeta = e.beta - 50;
                gravity.y = Matter.Common.clamp(normalizedBeta / 25, -1.5, 1.5);
            }
        };
        window.addEventListener('deviceorientation', handleOrientation, true);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            Runner.stop(runner);
            Engine.clear(engine);
            World.clear(world, false);
        };
    }, [records, triggerHaptic, stickerWidth, stickerHeight]);

    return (
    <div ref={containerRef} className={`absolute inset-0 z-10 rounded-[32px] overflow-hidden transition-opacity duration-500 ease-out ${engineReady ? 'opacity-100' : 'opacity-0'}`} style={{ touchAction: 'none' }}
        >
            {records.map((r, i) => (
                <div
                    key={`gravity-${r.id}`}
                    id={`matter-sticker-${i}`}
                    className="absolute top-0 left-0 will-change-transform cursor-grab active:cursor-grabbing"
                    style={{ width: stickerWidth, height: stickerHeight, zIndex: i + 10 }}
                >
                    {isExportableImageSrc(r.imageUrl) ? (
                        <img
                            src={r.imageUrl}
                            alt="drink"
                            className="w-full h-full object-contain pointer-events-none"
                            // 🚀 核心修复 3：把精美的白边滤镜重新注入到物理贴纸上！
                            style={{ filter: activeFilter }}
                        />
                    ) : (
                        <div
                            className="w-full h-full bg-bg-input rounded-xl flex items-center justify-center text-text-muted/50 pointer-events-none"
                            style={{ filter: activeFilter }}
                        >
                            <Coffee size={Math.max(12, 38 * stickerScale)} strokeWidth={2.5} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}