import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import * as htmlToImage from 'html-to-image';
import { DrinkRecord } from '@/types';
import { compressBase64Image } from '@/utils/helpers';
import { saveImageToDisk } from '@/utils/fileManager';

interface ExportActionsProps {
    records: DrinkRecord[];
    setRecords: (records: DrinkRecord[]) => void;
    prefLanguage: string;
    isDark: boolean;
    selectedAchv: any;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success') => void;
}

export function useExportActions({
    records, setRecords, prefLanguage, isDark, selectedAchv, showToast, triggerHaptic
}: ExportActionsProps) {

    // 1. 保存小票
    const handleSaveReceipt = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
        const receiptElement = targetRef.current;
        if (!receiptElement) return;
        try {
            showToast(prefLanguage === "English" ? "Saving..." : "正在保存...", 'info');
            triggerHaptic('medium');
            const dataUrl = await htmlToImage.toPng(receiptElement, { pixelRatio: 2, backgroundColor: "#f8f8f8" });

            if (Capacitor.isNativePlatform()) {
                const base64String = dataUrl.split(',')[1];
                const fileName = `SugarUltra_Receipt_${Date.now()}.png`;

                if (Capacitor.getPlatform() === 'android') {
                    await Filesystem.writeFile({ path: `DCIM/Sugar Ultra/${fileName}`, data: base64String, directory: Directory.ExternalStorage, recursive: true });
                    showToast(prefLanguage === "English" ? "Saved to Gallery!" : "✨ 已保存到相册【DCIM/Sugar Ultra】！", 'success');
                } else {
                    await Filesystem.writeFile({ path: `Sugar Ultra/${fileName}`, data: base64String, directory: Directory.Documents, recursive: true });
                    showToast(prefLanguage === "English" ? "Saved to Documents!" : "✨ 已保存到手机【文档/Sugar Ultra】！", 'success');
                }
                return;
            }
            const a = document.createElement("a");
            a.href = dataUrl; a.download = `SugarUltra_Receipt_${Date.now()}.png`;
            document.body.appendChild(a); a.click(); a.remove();
            showToast(prefLanguage === "English" ? "Saved!" : "✨ 保存成功！", 'success');
        } catch (error: any) {
            showToast(`保存失败: ${error.message}`, 'error');
        }
    };

    // 2. 分享小票
    const handleShareReceipt = async (targetRef: React.RefObject<HTMLDivElement | null>) => {
        const receiptElement = targetRef.current;
        if (!receiptElement) return;
        try {
            showToast(prefLanguage === "English" ? "Preparing..." : "正在生成小票...", 'info');
            triggerHaptic('medium');
            const dataUrl = await htmlToImage.toPng(receiptElement, { pixelRatio: 2, backgroundColor: "#f8f8f8" });

            if (Capacitor.isNativePlatform()) {
                try {
                    const savedFile = await Filesystem.writeFile({ path: `receipt_${Date.now()}.png`, data: dataUrl.split(',')[1], directory: Directory.Cache });
                    await CapShare.share({ title: "我的奶茶小票", files: [savedFile.uri] });
                } catch (nativeError: any) {
                    if (nativeError.message !== 'Share canceled') showToast(`分享失败: ${nativeError.message}`, 'error');
                }
                return;
            }
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `naicha-receipt-${Date.now()}.png`, { type: "image/png" });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: "我的奶茶小票", files: [file] });
            } else {
                const a = document.createElement("a"); a.href = dataUrl; a.download = `naicha-receipt-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove();
                showToast("不支持分享，已为您保存图片", 'info');
            }
        } catch (error) { showToast("生成失败", 'error'); }
    };

    // 3. 分享成就海报
    const handleShareAchievement = async () => {
        const node = document.getElementById('achievement-card');
        if (!node || !selectedAchv) return;
        try {
            showToast(prefLanguage === 'English' ? 'Generating poster...' : '正在生成高光海报...', 'info');
            triggerHaptic('medium');
            const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 3, backgroundColor: isDark ? '#1a1a1e' : '#faf8f5' });

            if (Capacitor.isNativePlatform()) {
                try {
                    const savedFile = await Filesystem.writeFile({ path: `DCIM/Sugar Ultra/achv_${Date.now()}.png`, data: dataUrl.split(',')[1], directory: Directory.ExternalStorage, recursive: true });
                    await CapShare.share({ title: `我解锁了成就：${selectedAchv.title}`, text: selectedAchv.buildText(selectedAchv.trigger).comment, files: [savedFile.uri] });
                } catch (nativeError: any) {
                    if (nativeError.message !== 'Share canceled') showToast(`分享失败: ${nativeError.message}`, 'error');
                }
                return;
            }
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `老糖人成就-${selectedAchv.title}.png`, { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: `我解锁了成就：${selectedAchv.title}`, text: selectedAchv.buildText(selectedAchv.trigger).comment });
            } else {
                const link = document.createElement('a'); link.download = `老糖人成就-${selectedAchv.title}.png`; link.href = dataUrl; link.click();
                showToast('已保存图片，去分享吧！', 'success');
            }
        } catch (error) { showToast('海报生成失败', 'error'); }
    };

    // 4. 导出 JSON 数据
    const handleExportData = async () => {
        triggerHaptic('medium');
        const dataStr = JSON.stringify(records);
        const fileName = `SugarUltra_Backup_${new Date().toLocaleDateString().split('/').join('-')}.json`;
        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.writeFile({ path: `Sugar Ultra/${fileName}`, data: dataStr, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true });
                showToast('✨ 备份已成功保存到手机【文档/Sugar Ultra】！', 'success');
            } catch (error: any) { showToast(`导出失败: ${error.message}`, 'error'); }
        } else {
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            showToast('✨ 备份数据导出成功！', 'success');
        }
    };

    // 5. 导入 JSON 数据
    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (Array.isArray(imported)) {
                    if (window.confirm('⚠️ 警告：这会覆盖当前所有的记录！\n\n确认导入吗？')) {
                        setRecords(imported);
                        triggerHaptic('heavy');
                        showToast('✨ 数据恢复成功！', 'success');
                    }
                } else throw new Error("Invalid format");
            } catch (err) { showToast('文件格式错误，无法读取', 'error'); }
            if (e.target) e.target.value = '';
        };
        reader.readAsText(file);
    };

    // 6. 史诗级架构升级：将内存中的所有 Base64 历史图片迁移至物理磁盘
    const handleCompressHistory = async () => {
        triggerHaptic('medium');
        showToast('正在执行底层数据大迁徙，请勿退出 App...', 'info');
        let migratedCount = 0;

        const updatedRecords = await Promise.all(records.map(async (record) => {
            // 只要发现带有 data:image 前缀的“内存炸弹”，立刻存盘
            if (record.imageUrl && record.imageUrl.startsWith('data:image/')) {
                try {
                    const filename = `boba_migrated_${record.id}.jpg`;
                    const diskUri = await saveImageToDisk(record.imageUrl, filename);
                    migratedCount++;
                    return { ...record, imageUrl: diskUri }; // 替换为极短的物理路径
                } catch (e) { return record; }
            }
            return record;
        }));

        if (migratedCount > 0) {
            setRecords(updatedRecords);
            showToast(`✨ 架构升级完成！成功将 ${migratedCount} 张历史照片移至底层磁盘，内存已大幅释放！`, 'success');
            triggerHaptic('heavy');
        } else {
            showToast('所有照片已是最高效的物理存储状态，无需优化！', 'success');
        }
    };

    return {
        handleSaveReceipt,
        handleShareReceipt,
        handleShareAchievement,
        handleExportData,
        handleImportData,
        handleCompressHistory
    };
}