/**
 * Maps cantillation (ta'am) Unicode characters to image filenames.
 * Images live in /public/taamim/
 */
export const TAAM_MAP: Record<string, string> = {
  '\u0591': 'etnahta.png',     // Etnahta ֑
  '\u0592': 'segol.png',       // Segol accent ֒
  '\u0593': 'shalshelet.png',  // Shalshelet ֓
  '\u0594': 'zaqef_qatan.png', // Zaqef Qatan ֔
  '\u0595': 'zaqef_gadol.png', // Zaqef Gadol ֕
  '\u0596': 'tipcha.png',      // Tipcha ֖
  '\u0597': 'revia.png',       // Revia ֗
  '\u0598': 'zarqa.png',       // Zarqa ֘
  '\u0599': 'pashta.png',      // Pashta ֙
  '\u059A': 'yetiv.png',       // Yetiv ֚
  '\u059B': 'tevir.png',       // Tevir ֛
  '\u059C': 'geresh.png',      // Geresh ֜
  '\u059D': 'geresh_muqdam.png', // Geresh Muqdam ֝
  '\u059E': 'gershayim.png',   // Gershayim ֞
  '\u059F': 'qarney_para.png', // Qarney Para ֟
  '\u05A0': 'telisha_gedola.png', // Telisha Gedola ֠
  '\u05A1': 'pazer.png',       // Pazer ֡
  '\u05A2': 'atnah_hafukh.png',// Atnah Hafukh ֢
  '\u05A3': 'munach.png',      // Munach ֣
  '\u05A4': 'mahapakh.png',    // Mahapakh ֤
  '\u05A5': 'mercha.png',      // Mercha ֥
  '\u05A6': 'mercha_kefula.png',// Mercha Kefula ֦
  '\u05A7': 'darga.png',       // Darga ֧
  '\u05A8': 'qadma.png',       // Qadma ֨
  '\u05A9': 'telisha_qetana.png',// Telisha Qetana ֩
  '\u05AA': 'yerah_ben_yomo.png',// Yerah Ben Yomo ֪
  '\u05AB': 'ole.png',         // Ole ֫
  '\u05AC': 'iluy.png',        // Iluy ֬
  '\u05AD': 'dehi.png',        // Dehi ֭
  '\u05AE': 'zinor.png',       // Zinor ֮
  '\u05AF': 'masora_circle.png',// Masora Circle ֯
  '\u05C0': 'sofpasuk.png',    // Paseq ׀ (used as sof pasuk separator)
  '\u05BE': 'maqaf.png',       // Maqaf ־
}

/**
 * Get the image filename for a ta'am character.
 * Falls back to a generic placeholder if not found.
 */
export function getTaamImage(taam: string | null): string {
  if (!taam) return 'placeholder.png'
  return TAAM_MAP[taam] ?? 'placeholder.png'
}

/**
 * Get the display name for a ta'am character.
 */
export const TAAM_NAMES: Record<string, string> = {
  '\u0591': 'Etnachta',
  '\u0592': 'Segol',
  '\u0593': 'Shalshelet',
  '\u0594': 'Zakef katon',
  '\u0595': 'Zakef gadol',
  '\u0596': 'Tipcha',
  '\u0597': 'Revia',
  '\u0598': 'Zarka',
  '\u0599': 'Pashta',
  '\u059A': 'Yetiv',
  '\u059B': 'Tevir',
  '\u059C': 'Geresh',
  '\u059D': 'Geresh muqdam',
  '\u059E': 'Gershayim',
  '\u059F': 'Karnei para',
  '\u05A0': 'Telisha gedola',
  '\u05A1': 'Pazer',
  '\u05A2': 'Etnachta hafuch',
  '\u05A3': 'Munach',
  '\u05A4': 'Mapach',
  '\u05A5': 'Mercha',
  '\u05A6': 'Mercha kefula',
  '\u05A7': 'Darga',
  '\u05A8': 'Kadma',
  '\u05A9': 'Telisha ketana',
  '\u05AA': 'Yerach ben yomo',
  '\u05AB': 'Ole',
  '\u05AC': 'Iluy',
  '\u05AD': 'Dechi',
  '\u05AE': 'Zinor',
  '\u05C0': 'Sof pasuk',
  '\u05BE': 'Maqaf',
}

/**
 * Phonetic (Ashkenazi-style) hand-sign names, used as video filename parts.
 * Silluk (U+05BD) is only a trop at the end of a verse; see taamSequences.ts.
 */
export const SILLUK_SLUG = 'silluk'

export const TAAM_SLUGS: Record<string, string> = {
  '\u0591': 'etnachta',
  '\u0592': 'segol',
  '\u0593': 'shalshelet',
  '\u0594': 'zakef-katon',
  '\u0595': 'zakef-gadol',
  '\u0596': 'tipcha',
  '\u0597': 'revia',
  '\u0598': 'zarka',
  '\u0599': 'pashta',
  '\u059A': 'yetiv',
  '\u059B': 'tevir',
  '\u059C': 'geresh',
  '\u059D': 'geresh-muqdam',
  '\u059E': 'gershayim',
  '\u059F': 'karnei-para',
  '\u05A0': 'telisha-gedola',
  '\u05A1': 'pazer',
  '\u05A2': 'etnachta-hafuch',
  '\u05A3': 'munach',
  '\u05A4': 'mapach',
  '\u05A5': 'mercha',
  '\u05A6': 'mercha-kefula',
  '\u05A7': 'darga',
  '\u05A8': 'kadma',
  '\u05A9': 'telisha-ketana',
  '\u05AA': 'yerach-ben-yomo',
  '\u05AB': 'ole',
  '\u05AC': 'iluy',
  '\u05AD': 'dechi',
  '\u05AE': 'zinor',
}
