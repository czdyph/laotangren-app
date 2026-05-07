// 文件路径: utils/fileManager.ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const IMAGE_DIR = 'drink_images';

// 1. 初始化专门存奶茶图的文件夹
export const initImageDirectory = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await Filesystem.mkdir({
            path: IMAGE_DIR,
            directory: Directory.Data,
            recursive: true
        });
    } catch (e) {
        // 如果文件夹已存在，会走到这里，忽略即可
    }
};

// 2. 将 Base64 转换为物理文件，并返回手机的真实路径 (Native URI)
export const saveImageToDisk = async (base64Data: string, filename: string): Promise<string> => {
    // 如果是在电脑浏览器调试，直接返回原 Base64，不执行物理写入
    if (!Capacitor.isNativePlatform()) return base64Data;

    try {
        // 剥离掉 data:image/png;base64, 前缀，只保留纯数据
        const base64 = base64Data.split(',')[1] || base64Data;

        const savedFile = await Filesystem.writeFile({
            path: `${IMAGE_DIR}/${filename}`,
            data: base64,
            directory: Directory.Data
        });

        // 将沙盒路径转换为 <img src="..."> 能直接读取的绝对安全路径
        return Capacitor.convertFileSrc(savedFile.uri);
    } catch (error) {
        console.error("图片存入磁盘失败", error);
        return base64Data; // 失败则兜底使用 Base64
    }
};

// 3. 删除记录时，同步撕掉硬盘里的照片，防止垃圾堆积
export const deleteImageFromDisk = async (fileUri: string) => {
    if (!Capacitor.isNativePlatform() || !fileUri.includes(IMAGE_DIR)) return;
    try {
        // 从转换后的完整 URL 中提取出相对路径
        const pathMatch = fileUri.split(`${IMAGE_DIR}/`)[1];
        if (pathMatch) {
            await Filesystem.deleteFile({
                path: `${IMAGE_DIR}/${pathMatch}`,
                directory: Directory.Data
            });
        }
    } catch (e) {
        console.error("物理图片删除失败", e);
    }
};