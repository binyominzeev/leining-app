const BASE_URL = 'https://www.sefaria.org/api'

export type SefariaTextResponse = {
  he: string | string[] | string[][]
  heVersionTitle?: string
  title?: string
  book?: string
  categories?: string[]
}

/**
 * Fetch a range of verses from Sefaria.
 * ref format: e.g. "Genesis.1.1-3" or "Genesis.1.1"
 * lang=he fetches only Hebrew text.
 */
export async function fetchSefariaText(ref: string): Promise<SefariaTextResponse> {
  const url = `${BASE_URL}/texts/${encodeURIComponent(ref)}?lang=he&context=0&pad=0`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Sefaria API error: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as SefariaTextResponse
  return data
}

/**
 * Hebrew ordinal labels for each aliyah number (2–8 / maftir).
 * Aliyah 1 has no printed label (it is the start of the reading).
 */
export const ALIYAH_LABELS: Record<number, string> = {
  2: 'שני',
  3: 'שלישי',
  4: 'רביעי',
  5: 'חמישי',
  6: 'שישי',
  7: 'שביעי',
  8: 'מפטיר',
}

export type AliyahMarker = {
  aliyah: number   // 1-based aliyah number
  heLabel: string  // Hebrew ordinal label (e.g. שני)
  chapter: number
  verse: number
}

/**
 * Fetch the aliyah division refs for a given parasha (English name).
 * Uses the Sefaria calendars next-read API which returns aliyot in
 * extraDetails.aliyot as an array of refs like "Genesis 44:18-44:30".
 * Returns an array of AliyahMarker for aliyot 2–7 (plus maftir if present).
 * Aliyah 1 is omitted because it has no printed label.
 */
export async function fetchAliyot(parashaEn: string): Promise<AliyahMarker[]> {
  const url = `${BASE_URL}/calendars/next-read/${encodeURIComponent(parashaEn)}`
  const response = await fetch(url)
  if (!response.ok) return []

  const data = (await response.json()) as {
    parasha?: {
      extraDetails?: {
        aliyot?: string[]
      }
    }
  }

  const refs: string[] = data.parasha?.extraDetails?.aliyot ?? []

  const markers: AliyahMarker[] = []
  refs.forEach((ref, i) => {
    const aliyah = i + 1
    // Skip aliyah 1 — no printed label
    if (aliyah === 1) return
    const label = ALIYAH_LABELS[aliyah]
    if (!label) return
    // Parse the start chapter:verse from a ref like "Genesis 44:31-45:7"
    // Match digits:digits after a whitespace to avoid matching digits in book names
    const match = ref.match(/\s(\d+):(\d+)/)
    if (!match) return
    markers.push({
      aliyah,
      heLabel: label,
      chapter: parseInt(match[1], 10),
      verse: parseInt(match[2], 10),
    })
  })

  return markers
}

/**
 * Fetch the list of Parashot with their references.
 */
export type Parasha = {
  en: string
  he: string
  ref: string
  book: string
}

let parashotCache: Parasha[] | null = null

export async function fetchParashot(): Promise<Parasha[]> {
  if (parashotCache) return parashotCache

  const url = `${BASE_URL}/calendars?diaspora=1`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Sefaria API error: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as {
    calendar_items: Array<{
      title: { en: string; he: string }
      displayValue: { en: string; he: string }
      ref: string
      category: string
    }>
  }

  const torahItems = data.calendar_items.filter(
    (item) => item.category === 'Parashat Hashavua'
  )

  // Build static parasha list from the Sefaria index API
  const indexUrl = `${BASE_URL}/index/Torah`
  const indexResp = await fetch(indexUrl)
  if (!indexResp.ok) {
    // Fallback: use the calendar item
    parashotCache = torahItems.map((item) => ({
      en: item.displayValue.en,
      he: item.displayValue.he,
      ref: item.ref,
      book: item.ref.split(' ')[0],
    }))
    return parashotCache
  }

  const indexData = (await indexResp.json()) as {
    contents?: Array<{
      category: string
      contents: Array<{ title: string; heTitle: string; alts?: { Parasha?: { nodes?: Array<{ wholeRef: string; title: string; heTitle: string }> } } }>
    }>
  }

  const parashot: Parasha[] = []
  if (indexData.contents) {
    for (const bookGroup of indexData.contents) {
      for (const book of bookGroup.contents ?? []) {
        const nodes = book.alts?.Parasha?.nodes ?? []
        for (const node of nodes) {
          parashot.push({
            en: node.title,
            he: node.heTitle,
            ref: node.wholeRef,
            book: book.title,
          })
        }
      }
    }
  }

  if (parashot.length > 0) {
    parashotCache = parashot
  } else {
    // Fallback to static list
    parashotCache = STATIC_PARASHOT
  }

  return parashotCache
}

/**
 * Static fallback list of all 54 parashot.
 */
export const STATIC_PARASHOT: Parasha[] = [
  { en: 'Bereshit', he: 'בְּרֵאשִׁית', ref: 'Genesis 1:1-6:8', book: 'Genesis' },
  { en: 'Noach', he: 'נֹחַ', ref: 'Genesis 6:9-11:32', book: 'Genesis' },
  { en: 'Lech Lecha', he: 'לֶךְ-לְךָ', ref: 'Genesis 12:1-17:27', book: 'Genesis' },
  { en: 'Vayera', he: 'וַיֵּרָא', ref: 'Genesis 18:1-22:24', book: 'Genesis' },
  { en: 'Chayei Sara', he: 'חַיֵּי שָׂרָה', ref: 'Genesis 23:1-25:18', book: 'Genesis' },
  { en: 'Toldot', he: 'תּוֹלְדֹת', ref: 'Genesis 25:19-28:9', book: 'Genesis' },
  { en: 'Vayetzei', he: 'וַיֵּצֵא', ref: 'Genesis 28:10-32:3', book: 'Genesis' },
  { en: 'Vayishlach', he: 'וַיִּשְׁלַח', ref: 'Genesis 32:4-36:43', book: 'Genesis' },
  { en: 'Vayeshev', he: 'וַיֵּשֶׁב', ref: 'Genesis 37:1-40:23', book: 'Genesis' },
  { en: 'Miketz', he: 'מִקֵּץ', ref: 'Genesis 41:1-44:17', book: 'Genesis' },
  { en: 'Vayigash', he: 'וַיִּגַּשׁ', ref: 'Genesis 44:18-47:27', book: 'Genesis' },
  { en: 'Vayechi', he: 'וַיְחִי', ref: 'Genesis 47:28-50:26', book: 'Genesis' },
  { en: 'Shemot', he: 'שְׁמוֹת', ref: 'Exodus 1:1-6:1', book: 'Exodus' },
  { en: 'Vaera', he: 'וָאֵרָא', ref: 'Exodus 6:2-9:35', book: 'Exodus' },
  { en: 'Bo', he: 'בֹּא', ref: 'Exodus 10:1-13:16', book: 'Exodus' },
  { en: 'Beshalach', he: 'בְּשַׁלַּח', ref: 'Exodus 13:17-17:16', book: 'Exodus' },
  { en: 'Yitro', he: 'יִתְרוֹ', ref: 'Exodus 18:1-20:23', book: 'Exodus' },
  { en: 'Mishpatim', he: 'מִּשְׁפָּטִים', ref: 'Exodus 21:1-24:18', book: 'Exodus' },
  { en: 'Terumah', he: 'תְּרוּמָה', ref: 'Exodus 25:1-27:19', book: 'Exodus' },
  { en: 'Tetzaveh', he: 'תְּצַוֶּה', ref: 'Exodus 27:20-30:10', book: 'Exodus' },
  { en: "Ki Tisa", he: 'כִּי תִשָּׂא', ref: 'Exodus 30:11-34:35', book: 'Exodus' },
  { en: 'Vayakhel', he: 'וַיַּקְהֵל', ref: 'Exodus 35:1-38:20', book: 'Exodus' },
  { en: 'Pekudei', he: 'פְקוּדֵי', ref: 'Exodus 38:21-40:38', book: 'Exodus' },
  { en: 'Vayikra', he: 'וַיִּקְרָא', ref: 'Leviticus 1:1-5:26', book: 'Leviticus' },
  { en: 'Tzav', he: 'צַו', ref: 'Leviticus 6:1-8:36', book: 'Leviticus' },
  { en: 'Shemini', he: 'שְּׁמִינִי', ref: 'Leviticus 9:1-11:47', book: 'Leviticus' },
  { en: 'Tazria', he: 'תַזְרִיעַ', ref: 'Leviticus 12:1-13:59', book: 'Leviticus' },
  { en: 'Metzora', he: 'מְּצֹרָע', ref: 'Leviticus 14:1-15:33', book: 'Leviticus' },
  { en: 'Achrei Mot', he: 'אַחֲרֵי מוֹת', ref: 'Leviticus 16:1-18:30', book: 'Leviticus' },
  { en: 'Kedoshim', he: 'קְדשִׁים', ref: 'Leviticus 19:1-20:27', book: 'Leviticus' },
  { en: 'Emor', he: 'אֱמֹר', ref: 'Leviticus 21:1-24:23', book: 'Leviticus' },
  { en: 'Behar', he: 'בְּהַר', ref: 'Leviticus 25:1-26:2', book: 'Leviticus' },
  { en: 'Bechukotai', he: 'בְּחֻקֹּתַי', ref: 'Leviticus 26:3-27:34', book: 'Leviticus' },
  { en: 'Bamidbar', he: 'בְּמִדְבַּר', ref: 'Numbers 1:1-4:20', book: 'Numbers' },
  { en: 'Naso', he: 'נָשֹׂא', ref: 'Numbers 4:21-7:89', book: 'Numbers' },
  { en: 'Behaalotecha', he: 'בְּהַעֲלֹתְךָ', ref: 'Numbers 8:1-12:16', book: 'Numbers' },
  { en: 'Shelach', he: 'שְׁלַח-לְךָ', ref: 'Numbers 13:1-15:41', book: 'Numbers' },
  { en: 'Korach', he: 'קֹרַח', ref: 'Numbers 16:1-18:32', book: 'Numbers' },
  { en: 'Chukat', he: 'חֻקַּת', ref: 'Numbers 19:1-22:1', book: 'Numbers' },
  { en: 'Balak', he: 'בָּלָק', ref: 'Numbers 22:2-25:9', book: 'Numbers' },
  { en: 'Pinchas', he: 'פִּינְחָס', ref: 'Numbers 25:10-30:1', book: 'Numbers' },
  { en: 'Matot', he: 'מַּטּוֹת', ref: 'Numbers 30:2-32:42', book: 'Numbers' },
  { en: 'Masei', he: 'מַסְעֵי', ref: 'Numbers 33:1-36:13', book: 'Numbers' },
  { en: 'Devarim', he: 'דְּבָרִים', ref: 'Deuteronomy 1:1-3:22', book: 'Deuteronomy' },
  { en: 'Vaetchanan', he: 'וָאֶתְחַנַּן', ref: 'Deuteronomy 3:23-7:11', book: 'Deuteronomy' },
  { en: 'Eikev', he: 'עֵקֶב', ref: 'Deuteronomy 7:12-11:25', book: 'Deuteronomy' },
  { en: "Re'eh", he: 'רְאֵה', ref: 'Deuteronomy 11:26-16:17', book: 'Deuteronomy' },
  { en: 'Shoftim', he: 'שֹׁפְטִים', ref: 'Deuteronomy 16:18-21:9', book: 'Deuteronomy' },
  { en: 'Ki Teitzei', he: 'כִּי-תֵצֵא', ref: 'Deuteronomy 21:10-25:19', book: 'Deuteronomy' },
  { en: 'Ki Tavo', he: 'כִּי-תָבוֹא', ref: 'Deuteronomy 26:1-29:8', book: 'Deuteronomy' },
  { en: 'Nitzavim', he: 'נִצָּבִים', ref: 'Deuteronomy 29:9-30:20', book: 'Deuteronomy' },
  { en: 'Vayeilech', he: 'וַיֵּלֶךְ', ref: 'Deuteronomy 31:1-31:30', book: 'Deuteronomy' },
  { en: "Ha'azinu", he: 'הַאֲזִינוּ', ref: 'Deuteronomy 32:1-32:52', book: 'Deuteronomy' },
  { en: 'Vezot Haberakhah', he: 'וְזֹאת הַבְּרָכָה', ref: 'Deuteronomy 33:1-34:12', book: 'Deuteronomy' },
]

/**
 * Books of the Tanach with chapter counts for navigation.
 */
export const TANACH_BOOKS: { name: string; hebrewName: string; chapters: number }[] = [
  { name: 'Genesis', hebrewName: 'בְּרֵאשִׁית', chapters: 50 },
  { name: 'Exodus', hebrewName: 'שְׁמוֹת', chapters: 40 },
  { name: 'Leviticus', hebrewName: 'וַיִּקְרָא', chapters: 27 },
  { name: 'Numbers', hebrewName: 'בְּמִדְבַּר', chapters: 36 },
  { name: 'Deuteronomy', hebrewName: 'דְּבָרִים', chapters: 34 },
  { name: 'Joshua', hebrewName: 'יְהוֹשֻׁעַ', chapters: 24 },
  { name: 'Judges', hebrewName: 'שֹׁפְטִים', chapters: 21 },
  { name: 'I Samuel', hebrewName: 'שְׁמוּאֵל א', chapters: 31 },
  { name: 'II Samuel', hebrewName: 'שְׁמוּאֵל ב', chapters: 24 },
  { name: 'I Kings', hebrewName: 'מְלָכִים א', chapters: 22 },
  { name: 'II Kings', hebrewName: 'מְלָכִים ב', chapters: 25 },
  { name: 'Isaiah', hebrewName: 'יְשַׁעְיָהוּ', chapters: 66 },
  { name: 'Jeremiah', hebrewName: 'יִרְמְיָהוּ', chapters: 52 },
  { name: 'Ezekiel', hebrewName: 'יְחֶזְקֵאל', chapters: 48 },
  { name: 'Hosea', hebrewName: 'הוֹשֵׁעַ', chapters: 14 },
  { name: 'Joel', hebrewName: 'יוֹאֵל', chapters: 4 },
  { name: 'Amos', hebrewName: 'עָמוֹס', chapters: 9 },
  { name: 'Obadiah', hebrewName: 'עֹבַדְיָה', chapters: 1 },
  { name: 'Jonah', hebrewName: 'יוֹנָה', chapters: 4 },
  { name: 'Micah', hebrewName: 'מִיכָה', chapters: 7 },
  { name: 'Nahum', hebrewName: 'נַחוּם', chapters: 3 },
  { name: 'Habakkuk', hebrewName: 'חֲבַקּוּק', chapters: 3 },
  { name: 'Zephaniah', hebrewName: 'צְפַנְיָה', chapters: 3 },
  { name: 'Haggai', hebrewName: 'חַגַּי', chapters: 2 },
  { name: 'Zechariah', hebrewName: 'זְכַרְיָה', chapters: 14 },
  { name: 'Malachi', hebrewName: 'מַלְאָכִי', chapters: 3 },
  { name: 'Psalms', hebrewName: 'תְּהִלִּים', chapters: 150 },
  { name: 'Proverbs', hebrewName: 'מִשְׁלֵי', chapters: 31 },
  { name: 'Job', hebrewName: 'אִיּוֹב', chapters: 42 },
  { name: 'Song of Songs', hebrewName: 'שִׁיר הַשִּׁירִים', chapters: 8 },
  { name: 'Ruth', hebrewName: 'רוּת', chapters: 4 },
  { name: 'Lamentations', hebrewName: 'אֵיכָה', chapters: 5 },
  { name: 'Ecclesiastes', hebrewName: 'קֹהֶלֶת', chapters: 12 },
  { name: 'Esther', hebrewName: 'אֶסְתֵּר', chapters: 10 },
  { name: 'Daniel', hebrewName: 'דָּנִיֵּאל', chapters: 12 },
  { name: 'Ezra', hebrewName: 'עֶזְרָא', chapters: 10 },
  { name: 'Nehemiah', hebrewName: 'נְחֶמְיָה', chapters: 13 },
  { name: 'I Chronicles', hebrewName: 'דִּבְרֵי הַיָּמִים א', chapters: 29 },
  { name: 'II Chronicles', hebrewName: 'דִּבְרֵי הַיָּמִים ב', chapters: 36 },
]
