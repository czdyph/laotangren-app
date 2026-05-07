// 1. 获取品牌标准化 Key
export const getBrandKey = (brand: string) => {
    if (!brand) return null;
    const lowerBrand = brand.toLowerCase();

    const rules: Record<string, string[]> = {
        CoCo: ["coco", "都可"],
        霸王茶姬: ["霸王茶姬", "bwcj", "bw"],
        茶百道: ["茶百道", "cbd", "cb"],
        茶话弄: ["茶话弄", "chn", "ch"],
        古茗: ["古茗", "gm"],
        沪上阿姨: ["沪上阿姨", "hsay", "hs"],
        眷茶: ["眷茶", "jc"],
        库迪咖啡: ["库迪", "kd"],
        蜜雪冰城: ["蜜雪冰城", "mxbc", "mx"],
        茉莉奶白: ["茉莉奶白", "mlnb", "ml"],
        奈雪: ["奈雪", "nx"],
        瑞幸: ["瑞幸", "rx"],
        书亦烧仙草: ["书亦烧仙草", "sysxc", "sys"],
        喜茶: ["喜茶", "xc"],
        幸运咖: ["幸运咖", "xyk", "xy"],
        爷爷不泡茶: ["爷爷不泡茶", "yybpc", "yy"],
        一点点: ["一点点", "ydd"],
        益禾堂: ["益禾堂", "yht", "yh"],
        柠季: ["柠季", "nj"],
        陆藜: ["陆藜", "ll"],
        甜啦啦: ["甜啦啦", "tll"],
        阿水大杯茶: ["阿水大杯茶", "asdbc", "as"],
        冰淳茶饮: ["冰淳茶饮", "bccy", "bc"],
        挪瓦咖啡: ["挪瓦咖啡", "nv"]
    };

    for (const [key, keywords] of Object.entries(rules)) {
        if (keywords.some(k => lowerBrand.includes(k))) {
            return key;
        }
    }

    return null;
};

// 2. 获取品牌对应的 Logo 图片名
export const getBrandLogoFile = (brand: string) => {
    const key = getBrandKey(brand);
    if (!key) return null;
    const logos: Record<string, string> = {
        CoCo: "CoCo.png",
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

// 3. 获取特定品牌的甜度选项
export const getSweetnessOptions = (brand: string) => {
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

// 4. HTML5 Canvas 前端图片压缩引擎
export const compressImage = (file: File, maxWidth = 800): Promise<string> => {
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

// 5. 校验图片是否可以用于导出
export const isExportableImageSrc = (src?: string) => {
    if (!src || src.length <= 2) return false;
    return !src.startsWith("blob:");
};
// 1. 高级莫兰迪色系配置
export const specificBrandColors: Record<string, string> = {
    "瑞幸": "#7291B3", "库迪咖啡": "#CB8282", "霸王茶姬": "#B5736E",
    "茶百道": "#83A9D1", "蜜雪冰城": "#E28383", "喜茶": "#A1A5A9",
    "奈雪": "#82A485", "古茗": "#D69670", "茶话弄": "#8AB6AD",
    "茉莉奶白": "#A3C6A8", "一点点": "#769676", "眷茶": "#D4AE75",
    "幸运咖": "#AD6969", "沪上阿姨": "#9A95C2", "CoCo": "#DCA562",
    "书亦烧仙草": "#A68679", "爷爷不泡茶": "#7B99B5", "益禾堂": "#8DAB7B",
    "柠季": "#B2C471", "未标记品牌": "#C2C2C2", "其他": "#D6D6D6"
};

// 2. 备选高颜值调色板
export const fallbackPalette = [
    '#E0A5A6', '#A0B8D1', '#A0C4A0', '#E2C180',
    '#B29FD6', '#D2AA8F', '#8BB8B8', '#DCA38D'
];

// 3. 动态获取品牌色
export const getBrandColor = (brand: string) => {
    if (specificBrandColors[brand]) return specificBrandColors[brand];
    const hash = Array.from(brand).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return fallbackPalette[hash % fallbackPalette.length];
};

// 4. 动态获取不同周期的印章称号
export const getReceiptTitle = (cups: number, period: string, lang: string) => {
    if (cups === 0) return lang === 'English' ? "Sugar Min" : "戒糖中";
    let limits = [5, 10, 15];
    if (period === 'week') limits = [1, 3, 5];
    if (period === 'year') limits = [20, 60, 100];
    if (cups <= limits[0]) return lang === 'English' ? "Sugar Pro" : "清糖佛子";
    if (cups <= limits[1]) return lang === 'English' ? "Sugar Promax" : "奶茶土匪";
    if (cups <= limits[2]) return lang === 'English' ? "Sugar ProMax+" : "老喝家";
    return lang === 'English' ? "Sugar Ultra" : "老糖人";
};

// 🌟 1. 历史数据图片压缩引擎
export const compressBase64Image = (base64Str: string, maxWidth = 800): Promise<string> => {
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
            if (!ctx) { resolve(base64Str); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = (error) => reject(error);
    });
};

// 🌟 2. 图片渲染预加载等待引擎
export const waitForReceiptAssets = async (element: HTMLElement) => {
    await document.fonts?.ready;
    const images = Array.from(element.querySelectorAll("img"));
    await Promise.all(
        images.map(async image => {
            if (image.complete) return;
            try { await image.decode(); } catch { /* ignore */ }
        })
    );
};

// 🌟 3. 全局成就计算引擎
export const getAchievementsData = (currentRecords: any[]) => {
    const unlockedMap = new Map();
    const chronological = [...currentRecords].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        if (a.day !== b.day) return a.day - b.day;
        return parseInt(a.id) - parseInt(b.id);
    });
    let brandSet = new Set();
    let noSugarCount = 0; let iceCount = 0; let hotCount = 0; let loyalCount = 1;

    for (let i = 0; i < chronological.length; i++) {
        const r = chronological[i];
        if (i === 0 && !unlockedMap.has('first_blood')) unlockedMap.set('first_blood', r);
        if (i === 199 && !unlockedMap.has('fifty_cups')) unlockedMap.set('fifty_cups', r);
        if (r.brand && !brandSet.has(r.brand)) {
            brandSet.add(r.brand);
            if (brandSet.size === 15 && !unlockedMap.has('five_brands')) unlockedMap.set('five_brands', r);
        }
        if (r.sweetness === '不另外加糖') {
            noSugarCount++;
            if (noSugarCount === 50 && !unlockedMap.has('no_sugar')) unlockedMap.set('no_sugar', r);
        }
        if (r.cost >= 15 && !unlockedMap.has('rich_guy')) unlockedMap.set('rich_guy', r);
        if (i > 0) {
            if (r.brand && r.brand === chronological[i - 1].brand) {
                loyalCount++;
                if (loyalCount === 7 && !unlockedMap.has('loyalist')) unlockedMap.set('loyalist', r);
            } else { loyalCount = 1; }
        }
        if (r.temperature?.includes('冰')) {
            iceCount++;
            if (iceCount === 100 && !unlockedMap.has('ice_king')) unlockedMap.set('ice_king', r);
        }
        if (r.temperature?.includes('热')) {
            hotCount++;
            if (hotCount === 100 && !unlockedMap.has('hot_king')) unlockedMap.set('hot_king', r);
        }
    }

    const achievementsList = [
        { id: 'first_blood', icon: '🍼', title: '初次邂逅', desc: '记录你的第一杯饮品', isUnlocked: unlockedMap.has('first_blood'), trigger: unlockedMap.get('first_blood'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，命运的齿轮开始转动。`, comment: `这是你在《老糖人》记录的第一杯奶茶。当时的你一定没想过，这仅仅是一条“不归路”的开始……` }) },
        { id: 'loyalist', icon: '❤️', title: '品牌死忠', desc: '连续 7 杯喝同一个品牌', isUnlocked: unlockedMap.has('loyalist'), trigger: unlockedMap.get('loyalist'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你达成了最高级别的羁绊。`, comment: `连续 7 杯「${t.brand || '该品牌'}」！你这已经不是爱了，你简直是他们家流落在外的野生代言人。` }) },
        { id: 'five_brands', icon: '🌍', title: '海王品鉴', desc: '品尝过 15 个不同的品牌', isUnlocked: unlockedMap.has('five_brands'), trigger: unlockedMap.get('five_brands'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的花心版图再次扩张。`, comment: `在尝遍了 14 个品牌后，最终是这杯「${t.brand || '新品牌'}」帮你补齐了海王拼图。你没有偏爱，你只是心碎成了 15 瓣，每一瓣都爱着不同的快乐水。` }) },
        { id: 'no_sugar', icon: '🧘', title: '清糖苦行僧', desc: '累计喝过 50 杯不另外加糖', isUnlocked: unlockedMap.has('no_sugar'), trigger: unlockedMap.get('no_sugar'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你立地成佛。`, comment: `累计 50 杯“不另外加糖”！你点的是奶茶吗？不，你点的是对世俗欲望的无情嘲讽。全国 99% 的清糖佛子正在为你点赞。` }) },
        { id: 'ice_king', icon: '🧊', title: '绝对零度', desc: '累计喝过 100 杯冷饮', isUnlocked: unlockedMap.has('ice_king'), trigger: unlockedMap.get('ice_king'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的胃壁凝结成冰。`, comment: `第 100 杯冷饮下肚！就算是凛冬将至，也无法阻止你对冰块的狂热。承认吧，你的血液里现在流淌的都是冰水混合物。` }) },
        { id: 'hot_king', icon: '♨️', title: '养生达人', desc: '累计喝过 100 杯热饮', isUnlocked: unlockedMap.has('hot_king'), trigger: unlockedMap.get('hot_king'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，保温杯里泡枸杞。`, comment: `第 100 杯热饮！你成功把奶茶喝出了老中医熬药的养生感。这杯烫嘴的「${t.type}」，是你对多巴胺最后的倔强。` }) },
        { id: 'rich_guy', icon: '💸', title: '破产预警', desc: '点过一杯价格超过 15 元的饮品', isUnlocked: unlockedMap.has('rich_guy'), trigger: unlockedMap.get('rich_guy'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你的钱包发出了悲鸣。`, comment: `这杯高达 ${t.cost} 元的「${t.brand || ''} · ${t.type}」，刺痛了钱包，却抚慰了灵魂。没关系，钱没有消失，它只是变成了你身上的肉肉陪着你。` }) },
        { id: 'fifty_cups', icon: '👑', title: '奶茶土匪', desc: '累计记录达到 200 杯', isUnlocked: unlockedMap.has('fifty_cups'), trigger: unlockedMap.get('fifty_cups'), buildText: (t: any) => ({ date: `${t.year}年${t.month + 1}月${t.day}日，你登上了糖分王座。`, comment: `第 200 杯！你已经不是普通的爱好者了，你是让整条街奶茶店老板都笑得合不拢嘴的老糖人。` }) },
    ];
    return { unlockedMap, achievementsList };
};


// 🌟 4. 打卡与意志力计算引擎
export const calculateDisciplineStats = (records: any[]) => {
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

    let soberDays = 0;
    if (!drankToday) {
        const lastDateParts = uniqueDays[0].split('-');
        const lastDate = new Date(Number(lastDateParts[0]), Number(lastDateParts[1]) - 1, Number(lastDateParts[2]));
        const diffTime = Math.max(0, todayClean.getTime() - lastDate.getTime());
        soberDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const showStreak = drankToday || (drankYesterday && streak > 0);
    const displayType = showStreak ? 'streak' : 'sober';

    let comment = "";
    if (showStreak) {
        if (streak >= 7) comment = "勋章建议直接焊在脑门上。胰岛：‘求求了，歇一天吧’。";
        else comment = "你的血管里现在流的不是血，是糖浆。";
    } else {
        if (soberDays >= 7) comment = "不得了！你居然扛过了 7 天。你现在呼吸的空气是不是都变甜了？";
        else comment = "三分钟热度？别急，隔壁的优惠券正在向你招手。";
    }

    return { streak, sober: soberDays, type: displayType, comment };
};