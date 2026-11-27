export interface ResolvedDocumentLink {
  href: string;
  isDirectDownload: boolean;
  isDrive: boolean;
  isFolder: boolean;
}

/**
 * Normalizes Google Drive file/Docs/Sheets/Slides URLs into direct download links
 * so clicking any attached authority or technical-service document downloads immediately,
 * while preserving Google Drive folders and external government portals (VUCEM, MCRF, etc.).
 */
export function resolveDocumentLinkUrl(rawUrl: string): ResolvedDocumentLink {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { href: '#', isDirectDownload: false, isDrive: false, isFolder: false };
  }

  // Google Drive Folder: https://drive.google.com/drive/folders/<ID>
  if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i.test(trimmed)) {
    return { href: trimmed, isDirectDownload: false, isDrive: true, isFolder: true };
  }

  // Google Drive File: /file/d/<ID>/... or open?id=<ID> or uc?id=<ID>
  const fileMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/i);

  if (fileMatch?.[1]) {
    return {
      href: `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`,
      isDirectDownload: true,
      isDrive: true,
      isFolder: false,
    };
  }

  // Google Docs / Sheets / Slides -> export PDF directly
  const docsMatch = trimmed.match(
    /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/i
  );
  if (docsMatch?.[1] && docsMatch?.[2]) {
    const kind = docsMatch[1].toLowerCase();
    const id = docsMatch[2];
    return {
      href: `https://docs.google.com/${kind}/d/${id}/export?format=pdf`,
      isDirectDownload: true,
      isDrive: true,
      isFolder: false,
    };
  }

  const isFileExt = /\.(pdf|xlsx?|docx?|csv|zip|png|jpe?g)(\?|$)/i.test(trimmed);
  return {
    href: trimmed,
    isDirectDownload: isFileExt,
    isDrive: /drive\.google\.com|docs\.google\.com/i.test(trimmed),
    isFolder: false,
  };
}
