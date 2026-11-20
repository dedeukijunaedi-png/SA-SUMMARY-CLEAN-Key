import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export interface ShareFileOptions {
  filename: string;
  title?: string;
  mimeType: string;
  text?: string;
  base64?: string;
}

export async function shareOrSaveFile(options: ShareFileOptions): Promise<number> {
  const { filename, title = filename, mimeType, text, base64 } = options;
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    const isText = !base64 && text != null;
    const data = (base64 ?? text ?? "") as string;
    let shareError = "";
    let fileSize = 0;

    try {
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Cache,
        recursive: true,
        ...(isText ? { encoding: Encoding.UTF8 } : {}),
      });
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: filename });
      const { size } = await Filesystem.stat({ directory: Directory.Cache, path: filename });
      if (!size) throw new Error("file kosong (0 byte)");
      fileSize = size;
      await Share.share({
        title,
        files: [uri],
        dialogTitle: `Bagikan / Simpan ${filename}`,
      });
      return fileSize;
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      if (/cancel/i.test(msg)) return fileSize;
      shareError = msg || "tidak diketahui";
      console.error("Native share error:", err);
    }

    try {
      try {
        await Filesystem.requestPermissions();
      } catch {}
      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Documents,
        recursive: true,
        ...(isText ? { encoding: Encoding.UTF8 } : {}),
      });
    } catch (err: any) {
      throw new Error(`Gagal export (${shareError}); simpan ke Documents juga gagal (${err?.message || err})`);
    }
    throw new Error(`Dialog bagikan gagal (${shareError}). File disimpan di Documents/${filename}`);
  }

  let blob: Blob;
  if (base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    blob = new Blob([byteArray], { type: mimeType });
  } else {
    blob = new Blob([text || ""], { type: mimeType });
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    typeof window !== "undefined" &&
    window.File
  ) {
    try {
      const file = new File([blob], filename, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          files: [file],
        });
        return blob.size;
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return blob.size;
      }
      console.warn("Web Share API error, using standard download:", e);
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return blob.size;
}
