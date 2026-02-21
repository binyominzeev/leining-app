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
  '\u0591': 'אֶתְנַחְתָּא',
  '\u0592': 'סֶגּוֹל',
  '\u0593': 'שַׁלְשֶׁלֶת',
  '\u0594': 'זָקֵף קָטָן',
  '\u0595': 'זָקֵף גָּדוֹל',
  '\u0596': 'טִפְּחָא',
  '\u0597': 'רְבִיעַ',
  '\u0598': 'זַרְקָא',
  '\u0599': 'פַּשְׁטָא',
  '\u059A': 'יְתִיב',
  '\u059B': 'תְּבִיר',
  '\u059C': 'גֵּרֵשׁ',
  '\u059D': 'גֵּרֵשׁ מֻקְדָּם',
  '\u059E': 'גֵּרְשַׁיִם',
  '\u059F': 'קַרְנֵי פָרָה',
  '\u05A0': 'תְּלִישָׁא גְּדוֹלָה',
  '\u05A1': 'פָּזֵר',
  '\u05A2': 'אַתְנַח הָפוּךְ',
  '\u05A3': 'מוּנַח',
  '\u05A4': 'מַהְפַּךְ',
  '\u05A5': 'מֵרְכָא',
  '\u05A6': 'מֵרְכָא כְּפוּלָה',
  '\u05A7': 'דַּרְגָּא',
  '\u05A8': 'קַדְמָא',
  '\u05A9': 'תְּלִישָׁא קְטַנָּה',
  '\u05AA': 'יֵרַח בֶּן יוֹמוֹ',
  '\u05AB': 'עֹולֶה',
  '\u05AC': 'עִלּוּי',
  '\u05AD': 'דְּחִי',
  '\u05AE': 'זִינוֹר',
  '\u05C0': 'סוֹף פָּסוּק',
  '\u05BE': 'מַקָּף',
}
