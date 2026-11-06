import type {
  Author, Work, Chapter, ChapterContent, ChapterPage, CoinPack,
} from '../types';

export const PACK_IDS = {
  p50: '10000000-0000-4000-8000-000000000050',
  p100: '10000000-0000-4000-8000-000000000100',
  p300: '10000000-0000-4000-8000-000000000300',
} as const;

export const seedPacks: CoinPack[] = [
  { id: PACK_IDS.p50, name: 'ตัวอย่าง 50 เหรียญ (mock)', coins: 50, amount_thb: 50, active: true, is_example_data: true },
  { id: PACK_IDS.p100, name: 'ตัวอย่าง 100 เหรียญ (mock)', coins: 100, amount_thb: 100, active: true, is_example_data: true },
  { id: PACK_IDS.p300, name: 'ตัวอย่าง 300 เหรียญ (mock)', coins: 300, amount_thb: 300, active: true, is_example_data: true },
];

export const seedAuthors: Author[] = [
  { id: 'a-001', display_name: 'นามปากกาตัวอย่าง' },
  { id: 'a-002', display_name: 'นักเขียนสมมติ' },
  { id: 'a-003', display_name: 'ตัวอย่างมังงะ' },
];

const W = (partial: Omit<Work, 'is_example_data' | 'status'> & Partial<Pick<Work, 'status' | 'featured' | 'popular' | 'is_new'>>): Work => ({
  is_example_data: true,
  status: 'published',
  ...partial,
});

export const seedWorks: Work[] = [
  W({ id: 'w-kdt', slug: 'keun-tee-dao-tok', title: 'คืนที่ดาวตก', synopsis: 'คืนที่ดาวตกพาดฟ้า เธอได้พบคนที่สัญญาว่าจะกลับมา — แต่คำสัญญานั้นเก่าไปสิบปีแล้ว (เรื่องย่อตัวอย่าง)', kind: 'novel', category: 'โรแมนติก', tags: ['โรแมนติก', 'ดราม่า'], rating: 'ทั่วไป', cover_tone: 'rose', author_id: 'a-001', author_name: 'นามปากกาตัวอย่าง', price_full_work: 120, chapter_count: 8, featured: true, popular: true }),
  W({ id: 'w-ngj', slug: 'nga-nai-krachok', title: 'เงาในกระจก', synopsis: 'ทุกครั้งที่มองกระจก เงาในนั้นไม่ใช่เธอ (เรื่องย่อตัวอย่าง)', kind: 'novel', category: 'สยองขวัญ', tags: ['สยองขวัญ', 'ลึกลับ'], rating: 'ทั่วไป', cover_tone: 'default', author_id: 'a-002', author_name: 'นักเขียนสมมติ', price_full_work: 90, chapter_count: 6, popular: true }),
  W({ id: 'w-cafe', slug: 'cafe-ton-tee-sam', title: 'คาเฟ่ตอนตีสาม', synopsis: 'คาเฟ่ที่เปิดเฉพาะหลังเที่ยงคืน มีกฎข้อเดียว — ลูกค้าต้องเล่าความลับหนึ่งอย่างก่อนสั่งเครื่องดื่ม (เรื่องย่อตัวอย่าง)', kind: 'novel', category: 'โรแมนติก', tags: ['โรแมนติก'], rating: 'ทั่วไป', cover_tone: 'warm', author_id: 'a-001', author_name: 'นามปากกาตัวอย่าง', price_full_work: 180, chapter_count: 6, popular: true }),
  W({ id: 'w-island', slug: 'koh-rai-chue', title: 'เกาะไร้ชื่อ', synopsis: 'แผนที่ไม่มีชื่อเกาะนี้ แต่มีคนยืนรออยู่บนหาดทุกเช้า (เรื่องย่อตัวอย่าง)', kind: 'manga', category: 'แฟนตาซี', tags: ['แฟนตาซี', 'ผจญภัย'], rating: 'ทั่วไป', cover_tone: 'teal', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 150, chapter_count: 5, popular: true, is_new: true }),
  W({ id: 'w-letter', slug: 'jodmai-teung-talay', title: 'จดหมายถึงทะเล', synopsis: 'เธอเขียนจดหมายทุกเดือน แล้วโยนลงทะเลโดยไม่หวังคำตอบ (เรื่องย่อตัวอย่าง)', kind: 'novel', category: 'โรแมนติก', tags: ['โรแมนติก'], rating: 'ทั่วไป', cover_tone: 'blue', author_id: 'a-002', author_name: 'นักเขียนสมมติ', price_full_work: null, chapter_count: 4, popular: true }),
  W({ id: 'w-wind', slug: 'sailom-tit-tai', title: 'สายลมทิศใต้', synopsis: 'เด็กชายกับนกกระสาเดินทางตามสายลมทิศใต้เพื่อตามหาบ้าน (เรื่องย่อตัวอย่าง)', kind: 'manga', category: 'แฟนตาซี', tags: ['แฟนตาซี'], rating: 'ทั่วไป', cover_tone: 'teal', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 100, chapter_count: 4, is_new: true }),
  W({ id: 'w-407', slug: 'hong-407', title: 'ห้อง 407', synopsis: 'หอพักห้อง 407 ไม่มีในแผนผังอาคาร แต่มีเสียงเดินออกมาทุกคืน (เรื่องย่อตัวอย่าง)', kind: 'manga', category: 'สยองขวัญ', tags: ['สยองขวัญ'], rating: 'ทั่วไป', cover_tone: 'rose', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 80, chapter_count: 4, is_new: true }),
  W({ id: 'w-sat', slug: 'dao-tiam-duang-sudtai', title: 'ดาวเทียมดวงสุดท้าย', synopsis: 'เมื่อดาวเทียมดวงสุดท้ายดับ โลกทั้งใบเงียบลงในวินาทีเดียว (เรื่องย่อตัวอย่าง)', kind: 'manga', category: 'ไซไฟ', tags: ['ไซไฟ'], rating: 'ทั่วไป', cover_tone: 'default', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 110, chapter_count: 3, is_new: true }),
];

function ch(work_id: string, number: number, title: string, pricing: 'free' | 'coin', coin_price: number): Chapter {
  return {
    id: `${work_id}-c${number}`,
    work_id,
    number,
    title,
    pricing,
    coin_price,
    status: 'published',
    is_example_data: true,
  };
}

export const seedChapters: Chapter[] = [
  // คาเฟ่ตอนตีสาม — matches mockup
  ch('w-cafe', 1, 'ประตูไม้เก่า', 'free', 0),
  ch('w-cafe', 2, 'กาแฟไม่มีน้ำตาล', 'free', 0),
  ch('w-cafe', 3, 'ลูกค้าประจำคนแรก', 'free', 0),
  ch('w-cafe', 4, 'ความลับบนแก้ว', 'coin', 8),
  ch('w-cafe', 5, 'ฝนสามทุ่ม', 'coin', 8),
  ch('w-cafe', 6, 'ที่นั่งริมหน้าต่าง', 'coin', 8),
  // คืนที่ดาวตก
  ch('w-kdt', 1, 'ดาวดวงแรก', 'free', 0),
  ch('w-kdt', 2, 'คำสัญญาเก่า', 'free', 0),
  ch('w-kdt', 3, 'สถานีรถไฟร้าง', 'coin', 5),
  ch('w-kdt', 4, 'จดหมายที่ไม่ได้ส่ง', 'coin', 5),
  ch('w-kdt', 5, 'ฝนดาวตก', 'coin', 5),
  ch('w-kdt', 6, 'คนที่รอ', 'coin', 5),
  ch('w-kdt', 7, 'ทางกลับ', 'coin', 5),
  ch('w-kdt', 8, 'ดาวดวงสุดท้าย', 'coin', 5),
  // เงาในกระจก
  ch('w-ngj', 1, 'เงาแรก', 'free', 0),
  ch('w-ngj', 2, 'ชื่อที่ไม่มีใครเรียก', 'free', 0),
  ch('w-ngj', 3, 'กระจกแตก', 'coin', 6),
  ch('w-ngj', 4, 'ห้องน้ำชั้นสอง', 'coin', 6),
  ch('w-ngj', 5, 'เสียงกระซิบ', 'coin', 6),
  ch('w-ngj', 6, 'ใบหน้าของฉัน', 'coin', 6),
  // จดหมายถึงทะเล
  ch('w-letter', 1, 'ซองแรก', 'free', 0),
  ch('w-letter', 2, 'คลื่นตอบกลับ', 'free', 0),
  ch('w-letter', 3, 'ทรายเปียก', 'free', 0),
  ch('w-letter', 4, 'ที่อยู่บนซอง', 'coin', 4),
  // มังงะ: เกาะไร้ชื่อ
  ch('w-island', 1, 'หาดไม่มีชื่อ', 'free', 0),
  ch('w-island', 2, 'แผนที่เปียก', 'free', 0),
  ch('w-island', 3, 'ไฟบนยอดเขา', 'coin', 5),
  ch('w-island', 4, 'คนรอ', 'coin', 5),
  ch('w-island', 5, 'เรือลำสุดท้าย', 'coin', 5),
  // สายลมทิศใต้
  ch('w-wind', 1, 'นกกระสา', 'free', 0),
  ch('w-wind', 2, 'หมู่บ้านลม', 'coin', 5),
  ch('w-wind', 3, 'สะพานเชือก', 'coin', 5),
  ch('w-wind', 4, 'ทิศใต้', 'coin', 5),
  // ห้อง 407
  ch('w-407', 1, 'กุญแจหล่น', 'free', 0),
  ch('w-407', 2, 'เสียงฝีเท้า', 'coin', 5),
  ch('w-407', 3, 'ประตูที่ไม่มีในผัง', 'coin', 5),
  ch('w-407', 4, 'ผู้เช่าเดิม', 'coin', 5),
  // ดาวเทียมดวงสุดท้าย
  ch('w-sat', 1, 'สัญญาณดับ', 'free', 0),
  ch('w-sat', 2, 'เมืองเงียบ', 'coin', 5),
  ch('w-sat', 3, 'ดวงสุดท้าย', 'coin', 5),
];

const cafeBody1 = `ฝนพรำลงมาตั้งแต่หัวค่ำ ถนนซอยแคบๆ ข้างสถานีรถไฟดูเงียบกว่าทุกคืนที่เธอเคยเดินผ่าน

ป้ายไม้สีซีดเขียนด้วยลายมือว่า "เปิดหลังเที่ยงคืน" แขวนเอียงๆ เหนือประตูบานเก่า สีน้ำตาลเข้มลอกเป็นด่าง

เธอผลักประตูเข้าไป กระดิ่งเล็กๆ ดังขึ้นหนึ่งครั้ง อากาศภายในอุ่นและมีกลิ่นกาแฟคั่วใหม่ๆ ปนกับส้มโอที่เพิ่งผ่า

"ยินดีต้อนรับ" เสียงจากหลังเคาน์เตอร์พูดแผ่วๆ "กฎมีข้อเดียว — เล่าความลับหนึ่งอย่าง แล้วค่อยสั่ง"

เธอยืนนิ่งอยู่ครู่หนึ่ง มองแก้วเรียงบนชั้น แล้วพูดเสียงเบาว่า "ฉันไม่ได้ตั้งใจจะมาที่นี่"`;

function fillerBody(workTitle: string, chapterTitle: string, n: number): string {
  return `นี่คือข้อความตัวอย่างสำหรับ "${workTitle}" ตอนที่ ${n} — ${chapterTitle}

ตัวละครตัวอย่างเดินผ่านซอยแคบในเมืองสมมติ ลมเย็นพัดผ่านป้ายไฟนีออนที่กะพริบไม่สม่ำเสมอ

"เราควรไปต่อไหม" ใครบางคนถาม

ไม่มีคำตอบชัดเจน มีเพียงเสียงฝนบนหลังคาสังกะสี และกลิ่นดินหลังฝน

ข้อความนี้เป็นตัวอย่างเพื่อทดสอบหน้าอ่านนิยายในโหมด mock · ไม่ใช่เนื้อหาจริงของผลิตภัณฑ์

ย่อหน้าถัดไปยังคงเป็นตัวอย่างซ้ำ เพื่อให้ความยาวพอสำหรับเลื่อนอ่านบนมือถือ และตรวจสอบระยะบรรทัด 1.85 ตามดีไซน์ของเซน`;
}

export const seedContents: ChapterContent[] = seedChapters
  .filter((c) => seedWorks.find((w) => w.id === c.work_id)?.kind === 'novel')
  .map((c) => {
    const work = seedWorks.find((w) => w.id === c.work_id)!;
    const body = c.id === 'w-cafe-c1' ? cafeBody1 : fillerBody(work.title, c.title, c.number);
    return { chapter_id: c.id, body };
  });

export const seedPages: ChapterPage[] = seedChapters
  .filter((c) => seedWorks.find((w) => w.id === c.work_id)?.kind === 'manga')
  .flatMap((c) =>
    [1, 2, 3].map((page_number) => ({
      chapter_id: c.id,
      page_number,
      storage_path: `mock/${c.work_id}/${c.number}/p${page_number}.png`,
    })),
  );

export const DEMO_PASSWORD = 'demo1234';
