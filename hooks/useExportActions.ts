import { Capacitor } from '@capacitor/core';
import { Share as CapShare } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import * as htmlToImage from 'html-to-image';
import { DrinkRecord } from '@/types';
import { saveImageToDisk } from '@/utils/fileManager';
import JSZip from 'jszip';

interface ExportActionsProps {
    records: DrinkRecord[];
    setRecords: (records: DrinkRecord[]) => void;
    prefLanguage: string;
    isDark: boolean;
    selectedAchv: any;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    triggerHaptic: (style?: 'light' | 'medium' | 'heavy' | 'success') => void;
    // 👇 新增：接收整个系统的偏好设置和恢复函数
    userSettings?: Record<string, any>;
    restoreSettings?: (settings: Record<string, any>) => void;
}

export function useExportActions({
    records, setRecords, prefLanguage, isDark, selectedAchv, showToast, triggerHaptic,
    userSettings, restoreSettings // 👈 接收新参数
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

    // 4. 终极打包导出 (包含图片和系统设置)
    const handleExportData = async () => {
        try {
            triggerHaptic('medium');
            showToast('正在打包数据、图片与系统设置...', 'info');
            const zip = new JSZip();

            // 1. 写入核心打卡数据
            zip.file("data.json", JSON.stringify(records, null, 2));

            // 🚀 1.5 写入系统偏好设置
            if (userSettings) {
                zip.file("settings.json", JSON.stringify(userSettings, null, 2));
            }

            // 2. 提取物理照片存入 images 文件夹
            const imgFolder = zip.folder("images");
            for (const record of records) {
                if (record.imageUrl && !record.imageUrl.startsWith('/logos/') && record.imageUrl !== '??') {
                    const fileName = record.imageUrl.split('/').pop() || `boba_${record.id}.jpg`;
                    if (fileName && imgFolder) {
                        try {
                            let base64Data = '';
                            if (record.imageUrl.startsWith('data:image')) {
                                base64Data = record.imageUrl.split(',')[1];
                            } else {
                                const response = await fetch(record.imageUrl);
                                const blob = await response.blob();
                                base64Data = await new Promise((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(blob);
                                });
                            }
                            imgFolder.file(fileName, base64Data, { base64: true });
                        } catch (e) {
                            console.warn(`[备份跳过] 找不到源文件或提取失败: ${fileName}`, e);
                        }
                    }
                }
            }

            // 3. 生成 Zip 文件
            const fileName = `SugarUltra_Backup_${new Date().toLocaleDateString().split('/').join('-')}.zip`;

            if (Capacitor.isNativePlatform()) {
                const zipBase64 = await zip.generateAsync({ type: "base64" });

                await Filesystem.writeFile({
                    path: `Sugar Ultra/${fileName}`,
                    data: zipBase64,
                    directory: Directory.Documents,
                    recursive: true
                });

                showToast('✨ 备份已成功保存到手机【文档/Sugar Ultra】！', 'success');
                triggerHaptic('success');
            } else {
                const blob = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                showToast('✨ 完整备份包下载成功！', 'success');
            }
        } catch (error: any) {
            console.error('Export failed:', error);
            showToast(`打包导出失败: ${error.message}`, 'error');
        }
    };

    // 5. 终极解压恢复 (解析 Zip，恢复数据、图片和系统设置)
    const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (window.confirm('⚠️ 警告：导入新备份将覆盖当前的所有记录和偏好设置！\n\n确认导入吗？')) {
            try {
                showToast('正在解压并重建数据库...', 'info');
                triggerHaptic('medium');

                const zip = new JSZip();
                const loadedZip = await zip.loadAsync(file);

                const jsonFile = loadedZip.file("data.json");
                if (!jsonFile) throw new Error("压缩包内找不到核心数据 (data.json)");

                const jsonStr = await jsonFile.async("string");
                const importedRecords = JSON.parse(jsonStr) as DrinkRecord[];

                // 重建图片库
                for (const record of importedRecords) {
                    if (record.imageUrl && !record.imageUrl.startsWith('/logos/') && record.imageUrl !== '??') {
                        const fileName = record.imageUrl.split('/').pop() || `boba_${record.id}.jpg`;
                        const imgFile = loadedZip.file(`images/${fileName}`);

                        if (imgFile) {
                            try {
                                const base64Data = await imgFile.async("base64");
                                const newDataUrl = `data:image/jpeg;base64,${base64Data}`;
                                record.imageUrl = await saveImageToDisk(newDataUrl, fileName);
                            } catch (imgErr) {
                                console.warn(`图片 ${fileName} 恢复失败，降级为空白图`, imgErr);
                                record.imageUrl = '';
                            }
                        } else {
                            record.imageUrl = '';
                        }
                    }
                }

                // 更新数据
                setRecords(importedRecords);

                // 🚀 3.5 尝试恢复系统设置
                const settingsFile = loadedZip.file("settings.json");
                if (settingsFile && restoreSettings) {
                    try {
                        const settingsStr = await settingsFile.async("string");
                        const importedSettings = JSON.parse(settingsStr);
                        restoreSettings(importedSettings);
                    } catch (e) {
                        console.warn("设置文件解析失败，跳过恢复设置", e);
                    }
                }

                triggerHaptic('heavy');
                showToast('✨ 数据与偏好设置重建成功！', 'success');
            } catch (err: any) {
                console.error('Import failed:', err);
                showToast(`恢复失败: ${err.message}`, 'error');
            }
        }
        if (e.target) e.target.value = '';
    };

    const handleCompressHistory = async () => {
        // ... (保持原样)
        triggerHaptic('medium');
        showToast('正在执行底层数据大迁徙，请勿退出 App...', 'info');
        let migratedCount = 0;

        const updatedRecords = await Promise.all(records.map(async (record) => {
            if (record.imageUrl && record.imageUrl.startsWith('data:image/')) {
                try {
                    const filename = `boba_migrated_${record.id}.jpg`;
                    const diskUri = await saveImageToDisk(record.imageUrl, filename);
                    migratedCount++;
                    return { ...record, imageUrl: diskUri };
                } catch (e) {
                    return record;
                }
            }
            return record;
        }));

        if (migratedCount > 0) {
            setRecords(updatedRecords);
            showToast(`✨ 架构升级完成！成功迁移 ${migratedCount} 张照片，内存大幅释放！`, 'success');
            triggerHaptic('heavy');
        } else {
            showToast('所有照片已是最高效的物理存储状态！', 'success');
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