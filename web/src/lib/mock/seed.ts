import type {
  Author, Work, Chapter, ChapterContent, ChapterPage, CoinPack, ReaderComment,
} from '../types';
import type { CoverTone } from '../types';

export const PACK_IDS = {
  p50: '10000000-0000-4000-8000-000000000050',
  p100: '10000000-0000-4000-8000-000000000100',
  p300: '10000000-0000-4000-8000-000000000300',
  p500: '10000000-0000-4000-8000-000000000500',
  p1000: '10000000-0000-4000-8000-000000001000',
} as const;

export const REFERRAL_PERCENT = 7;

export const seedPacks: CoinPack[] = [
  { id: PACK_IDS.p50, name: 'แพ็กเริ่มต้น', coins: 50, bonus_coins: 0, amount_thb: 50, active: true, is_example_data: true },
  { id: PACK_IDS.p100, name: 'แพ็กแนะนำ', coins: 100, bonus_coins: 10, amount_thb: 100, active: true, is_example_data: true },
  { id: PACK_IDS.p300, name: 'แพ็กกลาง', coins: 300, bonus_coins: 50, amount_thb: 300, active: true, is_example_data: true },
  { id: PACK_IDS.p500, name: 'แพ็กใหญ่', coins: 500, bonus_coins: 100, amount_thb: 500, active: true, is_example_data: true },
  { id: PACK_IDS.p1000, name: 'แพ็กผู้อ่านประจำ', coins: 1000, bonus_coins: 250, amount_thb: 1000, active: true, is_example_data: true },
];

export const seedAuthors: Author[] = [
  { id: 'a-001', display_name: 'นามปากกาตัวอย่าง' },
  { id: 'a-002', display_name: 'นักเขียนสมมติ' },
  { id: 'a-003', display_name: 'ตัวอย่างมังงะ' },
  { id: 'a-004', display_name: 'ฝนโปรย' },
  { id: 'a-005', display_name: 'ทีมแปลสมมติ' },
];

export const GENRES = ['โรแมนติก', 'แฟนตาซี', 'สยองขวัญ', 'ดราม่า', 'แอ็กชัน', 'ไซไฟ', 'ลึกลับ'] as const;

interface Spec {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  kind: 'novel' | 'manga';
  category: string;
  rating?: string;
  cover_tone: CoverTone;
  author_id: string;
  author_name: string;
  price_full_work: number | null;
  chapters: number;
  free: number;
  prices: number[];
  follow?: number[];
  featured?: boolean;
  popular?: boolean;
  is_new?: boolean;
  status?: 'published' | 'completed';
  views: number;
  score: number;
  rating_count: number;
  rank_daily: number;
  rank_weekly: number;
  rank_monthly: number;
  /** minutes since the newest episode was published */
  latestMin: number;
  titles: string[];
}

function agoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const SPECS: Spec[] = [
  {
    id: 'w-cafe', slug: 'cafe-ton-tee-sam', title: 'คาเฟ่ตอนตีสาม', kind: 'novel', category: 'โรแมนติก',
    synopsis: 'คาเฟ่ที่เปิดเฉพาะหลังเที่ยงคืน มีกฎข้อเดียว — ลูกค้าต้องเล่าความลับหนึ่งอย่างก่อนสั่งเครื่องดื่ม (เรื่องย่อตัวอย่าง)',
    cover_tone: 'warm', author_id: 'a-001', author_name: 'นามปากกาตัวอย่าง', price_full_work: 40,
    chapters: 8, free: 3, prices: [2, 3, 1, 2], follow: [5], featured: true, popular: true,
    views: 186400, score: 4.9, rating_count: 1284, rank_daily: 920, rank_weekly: 4100, rank_monthly: 15200, latestMin: 26,
    titles: ['ประตูไม้เก่า', 'กาแฟไม่มีน้ำตาล', 'ลูกค้าประจำคนแรก', 'ความลับบนแก้ว', 'ฝนสามทุ่ม', 'ที่นั่งริมหน้าต่าง', 'สูตรที่ไม่มีในเมนู', 'กุญแจสำรอง'],
  },
  {
    id: 'w-kdt', slug: 'keun-tee-dao-tok', title: 'คืนที่ดาวตก', kind: 'novel', category: 'โรแมนติก',
    synopsis: 'คืนที่ดาวตกพาดฟ้า เธอได้พบคนที่สัญญาว่าจะกลับมา — แต่คำสัญญานั้นเก่าไปสิบปีแล้ว (เรื่องย่อตัวอย่าง)',
    cover_tone: 'rose', author_id: 'a-001', author_name: 'นามปากกาตัวอย่าง', price_full_work: 48,
    chapters: 10, free: 2, prices: [1, 2, 3, 2], follow: [4], popular: true,
    views: 242800, score: 4.8, rating_count: 2104, rank_daily: 640, rank_weekly: 5300, rank_monthly: 19800, latestMin: 48,
    titles: ['ดาวดวงแรก', 'คำสัญญาเก่า', 'สถานีรถไฟร้าง', 'จดหมายที่ไม่ได้ส่ง', 'ฝนดาวตก', 'คนที่รอ', 'ทางกลับ', 'ดาวดวงสุดท้าย', 'ชานชาลาที่สาม', 'แสงก่อนรุ่ง'],
  },
  {
    id: 'w-ngj', slug: 'nga-nai-krachok', title: 'เงาในกระจก', kind: 'novel', category: 'สยองขวัญ',
    synopsis: 'ทุกครั้งที่มองกระจก เงาในนั้นไม่ใช่เธอ (เรื่องย่อตัวอย่าง)',
    cover_tone: 'default', author_id: 'a-002', author_name: 'นักเขียนสมมติ', price_full_work: 36,
    chapters: 8, free: 2, prices: [2, 2, 3, 1], follow: [6], popular: true,
    views: 99000, score: 4.6, rating_count: 860, rank_daily: 510, rank_weekly: 2400, rank_monthly: 8700, latestMin: 180,
    titles: ['เงาแรก', 'ชื่อที่ไม่มีใครเรียก', 'กระจกแตก', 'ห้องน้ำชั้นสอง', 'เสียงกระซิบ', 'ใบหน้าของฉัน', 'กรอบที่หายไป', 'คนในกระจก'],
  },
  {
    id: 'w-letter', slug: 'jodmai-teung-talay', title: 'จดหมายถึงทะเล', kind: 'novel', category: 'โรแมนติก',
    synopsis: 'เธอเขียนจดหมายทุกเดือน แล้วโยนลงทะเลโดยไม่หวังคำตอบ (เรื่องย่อตัวอย่าง)',
    cover_tone: 'blue', author_id: 'a-002', author_name: 'นักเขียนสมมติ', price_full_work: 18,
    chapters: 6, free: 3, prices: [1, 2, 1], status: 'completed',
    views: 54000, score: 4.7, rating_count: 640, rank_daily: 80, rank_weekly: 900, rank_monthly: 6200, latestMin: 60 * 24 * 5,
    titles: ['ซองแรก', 'คลื่นตอบกลับ', 'ทรายเปียก', 'ที่อยู่บนซอง', 'กระดาษเค็ม', 'จดหมายฉบับสุดท้าย'],
  },
  {
    id: 'w-roof', slug: 'fon-bon-dadfa', title: 'ฝนบนดาดฟ้า', kind: 'novel', category: 'ดราม่า',
    synopsis: 'หอพักห้าชั้นมีระเบียบห้ามขึ้นดาดฟ้า แต่คืนฝนตกมีคนจุดตะเกียงรออยู่ที่นั่นทุกครั้ง (เรื่องย่อตัวอย่าง)',
    cover_tone: 'blue', author_id: 'a-004', author_name: 'ฝนโปรย', price_full_work: 24,
    chapters: 7, free: 2, prices: [1, 2, 2, 3], follow: [4], is_new: true,
    views: 12400, score: 4.5, rating_count: 96, rank_daily: 740, rank_weekly: 1100, rank_monthly: 1100, latestMin: 90,
    titles: ['ตะเกียง', 'รองเท้าเปียก', 'กฎข้อห้า', 'ร่มคันเดียว', 'ชั้นห้า', 'จดหมายใต้กระถาง', 'ฝนหยุด'],
  },
  {
    id: 'w-lib', slug: 'hongsamut-thiangkhun', title: 'ห้องสมุดเที่ยงคืน', kind: 'novel', category: 'แฟนตาซี',
    synopsis: 'ห้องสมุดที่เปิดหลังทุกคนกลับบ้าน หนังสือบนชั้นที่สามเขียนเรื่องของผู้อ่านเอง (เรื่องย่อตัวอย่าง)',
    cover_tone: 'teal', author_id: 'a-001', author_name: 'นามปากกาตัวอย่าง', price_full_work: 42,
    chapters: 9, free: 2, prices: [2, 3, 3, 1], follow: [5], popular: true,
    views: 88000, score: 4.8, rating_count: 540, rank_daily: 430, rank_weekly: 3600, rank_monthly: 9100, latestMin: 360,
    titles: ['บัตรหมดอายุ', 'ชั้นที่สาม', 'หน้ากระดาษว่าง', 'บรรณารักษ์', 'ชื่อของฉัน', 'ดัชนีที่ไม่มี', 'โคมไฟอ่าน', 'หนังสือเล่มหนา', 'ปิดตีหนึ่ง'],
  },
  {
    id: 'w-vow', slug: 'sanya-nai-hong-muet', title: 'สัญญาในห้องมืด', kind: 'novel', category: 'โรแมนติก', rating: '18+',
    synopsis: 'สองคนทำสัญญากันในห้องที่ไม่มีหน้าต่าง ว่าจะไม่ถามอดีตของกันและกัน (เรื่องย่อตัวอย่าง เรต 18+)',
    cover_tone: 'rose', author_id: 'a-004', author_name: 'ฝนโปรย', price_full_work: 30,
    chapters: 8, free: 1, prices: [3, 2, 2, 1], follow: [3],
    views: 41000, score: 4.4, rating_count: 310, rank_daily: 380, rank_weekly: 1700, rank_monthly: 4400, latestMin: 120,
    titles: ['ประตูปิด', 'กฎข้อแรก', 'นาฬิกาไม่มีเข็ม', 'ชาไม่หวาน', 'ชื่อที่ห้ามเรียก', 'แสงจากช่องบาน', 'สัญญาข้อสอง', 'เช้าที่ยังมืด'],
  },
  {
    id: 'w-north', slug: 'rahat-dao-nuea', title: 'รหัสดาวเหนือ', kind: 'novel', category: 'ไซไฟ',
    synopsis: 'สถานีวิจัยขั้วโลกได้รับสัญญาณเป็นรหัสดาวเหนือทุกคืนตอน 03:17 และมีแค่เด็กฝึกงานคนเดียวที่ถอดได้ (เรื่องย่อตัวอย่าง)',
    cover_tone: 'default', author_id: 'a-002', author_name: 'นักเขียนสมมติ', price_full_work: 22,
    chapters: 6, free: 2, prices: [2, 1, 3], is_new: true,
    views: 23100, score: 4.6, rating_count: 140, rank_daily: 860, rank_weekly: 980, rank_monthly: 980, latestMin: 40,
    titles: ['03:17', 'สมุดรหัส', 'พายุหิมะ', 'เสาอากาศ', 'ข้อความตอบ', 'ดาวที่ไม่ออก'],
  },
  {
    id: 'w-island', slug: 'koh-rai-chue', title: 'เกาะไร้ชื่อ', kind: 'manga', category: 'แฟนตาซี',
    synopsis: 'แผนที่ไม่มีชื่อเกาะนี้ แต่มีคนยืนรออยู่บนหาดทุกเช้า (เรื่องย่อตัวอย่าง)',
    cover_tone: 'teal', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 28,
    chapters: 8, free: 2, prices: [1, 2, 3, 2], follow: [4], featured: true, popular: true, is_new: true,
    views: 156200, score: 5.0, rating_count: 990, rank_daily: 1100, rank_weekly: 4700, rank_monthly: 12000, latestMin: 18,
    titles: ['หาดไม่มีชื่อ', 'แผนที่เปียก', 'ไฟบนยอดเขา', 'คนรอ', 'เรือลำสุดท้าย', 'คลื่นยามเช้า', 'รอยเท้าคู่ที่สอง', 'ชื่อที่ถูกน้ำลบ'],
  },
  {
    id: 'w-wind', slug: 'sailom-tit-tai', title: 'สายลมทิศใต้', kind: 'manga', category: 'แฟนตาซี',
    synopsis: 'เด็กชายกับนกกระสาเดินทางตามสายลมทิศใต้เพื่อตามหาบ้าน (เรื่องย่อตัวอย่าง)',
    cover_tone: 'teal', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 20,
    chapters: 6, free: 1, prices: [2, 2, 1, 3],
    views: 67000, score: 4.7, rating_count: 420, rank_daily: 210, rank_weekly: 1500, rank_monthly: 5400, latestMin: 480,
    titles: ['นกกระสา', 'หมู่บ้านลม', 'สะพานเชือก', 'ทิศใต้', 'ขนนกขาว', 'บ้านหลังลม'],
  },
  {
    id: 'w-407', slug: 'hong-407', title: 'ห้อง 407', kind: 'manga', category: 'สยองขวัญ',
    synopsis: 'หอพักห้อง 407 ไม่มีในแผนผังอาคาร แต่มีเสียงเดินออกมาทุกคืน (เรื่องย่อตัวอย่าง)',
    cover_tone: 'rose', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 26,
    chapters: 8, free: 1, prices: [2, 3, 2, 1], follow: [3], is_new: true,
    views: 73400, score: 4.5, rating_count: 388, rank_daily: 690, rank_weekly: 2200, rank_monthly: 6100, latestMin: 55,
    titles: ['กุญแจหล่น', 'เสียงฝีเท้า', 'ประตูที่ไม่มีในผัง', 'ผู้เช่าเดิม', 'ลิฟต์ค้าง', 'หมายเลขที่ถูกลบ', 'ทางเดินมืด', 'ห้องว่าง'],
  },
  {
    id: 'w-sat', slug: 'dao-tiam-duang-sudtai', title: 'ดาวเทียมดวงสุดท้าย', kind: 'manga', category: 'ไซไฟ',
    synopsis: 'เมื่อดาวเทียมดวงสุดท้ายดับ โลกทั้งใบเงียบลงในวินาทีเดียว (เรื่องย่อตัวอย่าง)',
    cover_tone: 'default', author_id: 'a-005', author_name: 'ทีมแปลสมมติ', price_full_work: 16,
    chapters: 5, free: 1, prices: [3, 2, 2],
    views: 31200, score: 4.3, rating_count: 210, rank_daily: 140, rank_weekly: 800, rank_monthly: 3300, latestMin: 60 * 26,
    titles: ['สัญญาณดับ', 'เมืองเงียบ', 'ดวงสุดท้าย', 'คลื่นสั้น', 'ข้อความจากวงโคจร'],
  },
  {
    id: 'w-sword', slug: 'nakdab-rai-nam', title: 'นักดาบไร้นาม', kind: 'manga', category: 'แอ็กชัน',
    synopsis: 'นักดาบที่ไม่มีชื่อรับงานคุ้มกันกองคาราวานข้ามสะพานที่ถูกตัดทุกค่ำ (เรื่องย่อตัวอย่าง)',
    cover_tone: 'warm', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 54,
    chapters: 12, free: 3, prices: [1, 2, 2, 3], follow: [6], popular: true,
    views: 210500, score: 4.9, rating_count: 1760, rank_daily: 1300, rank_weekly: 6200, rank_monthly: 17400, latestMin: 12,
    titles: ['ดาบไม่มีชื่อ', 'สะพานขาด', 'ค่าจ้างหนึ่งเหรียญ', 'หมอกในหุบ', 'คนขับเกวียน', 'เงาคู่ที่สอง', 'ค่ายพัก', 'ฝนบนเหล็ก', 'สัญญาปากเปล่า', 'ทางแยก', 'ชื่อที่ถูกถาม', 'รุ่งสาง'],
  },
  {
    id: 'w-market', slug: 'talad-klang-khun', title: 'ตลาดกลางคืน', kind: 'manga', category: 'ลึกลับ',
    synopsis: 'ตลาดที่เปิดเฉพาะคนที่หลงทาง แผงแรกขายความทรงจำเป็นขวดแก้ว (เรื่องย่อตัวอย่าง)',
    cover_tone: 'warm', author_id: 'a-005', author_name: 'ทีมแปลสมมติ', price_full_work: 24,
    chapters: 7, free: 2, prices: [2, 1, 3, 2], follow: [5],
    views: 45200, score: 4.6, rating_count: 260, rank_daily: 300, rank_weekly: 1400, rank_monthly: 3900, latestMin: 240,
    titles: ['แผงแรก', 'ขวดความทรงจำ', 'ราคาที่เป็นชื่อ', 'ซอยกลับ', 'แม่ค้าไม่พูด', 'แผนที่ตลาด', 'ไฟดับ'],
  },
  {
    id: 'w-alley', slug: 'saeng-nai-soi', title: 'แสงในซอย', kind: 'manga', category: 'โรแมนติก',
    synopsis: 'ซอยแคบหลังโรงหนังมีร้านซ่อมนาฬิกาที่เปิดไฟดวงเดียวทุกคืนหลังเลิกงาน (เรื่องย่อตัวอย่าง)',
    cover_tone: 'rose', author_id: 'a-005', author_name: 'ทีมแปลสมมติ', price_full_work: 16,
    chapters: 6, free: 2, prices: [1, 1, 2], is_new: true,
    views: 28600, score: 4.8, rating_count: 180, rank_daily: 770, rank_weekly: 1300, rank_monthly: 1300, latestMin: 70,
    titles: ['นาฬิกาหยุด', 'ไฟดวงเดียว', 'ตั๋วหนังเก่า', 'สายสร้อย', 'ซอยฝน', 'เข็มวินาที'],
  },
  {
    id: 'w-ash', slug: 'botphleng-khong-thaothan', title: 'บทเพลงของเถ้าถ่าน', kind: 'manga', category: 'แฟนตาซี',
    synopsis: 'เมืองที่เพลงกลายเป็นเถ้าเมื่อร้องจบ เหลือนักดนตรีคนสุดท้ายที่ยังจำท่อนแรกได้ (เรื่องย่อตัวอย่าง)',
    cover_tone: 'blue', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 32,
    chapters: 8, free: 2, prices: [2, 3, 2, 1], status: 'completed',
    views: 91200, score: 4.9, rating_count: 770, rank_daily: 60, rank_weekly: 700, rank_monthly: 8100, latestMin: 60 * 24 * 9,
    titles: ['ท่อนแรก', 'เถ้าบนเวที', 'สายที่ขาด', 'เมืองเงียบ', 'โน้ตในกระเป๋า', 'ผู้ฟังคนสุดท้าย', 'คอร์ดที่ห้ามร้อง', 'เพลงจบ'],
  },
  {
    id: 'w-friday', slug: 'kot-khong-khun-wan-suk', title: 'กฎของคืนวันศุกร์', kind: 'manga', category: 'สยองขวัญ', rating: '18+',
    synopsis: 'หอพักมีกฎข้อหนึ่งที่ห้ามออกจากห้องหลังเที่ยงคืนวันศุกร์ (เรื่องย่อตัวอย่าง เรต 18+)',
    cover_tone: 'default', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 22,
    chapters: 6, free: 1, prices: [3, 3, 2, 2], follow: [2],
    views: 38900, score: 4.2, rating_count: 240, rank_daily: 250, rank_weekly: 1600, rank_monthly: 4100, latestMin: 200,
    titles: ['กฎข้อหนึ่ง', 'ทางเดิน', 'นาฬิกาเที่ยงคืน', 'ห้องข้างๆ', 'ไฟบันได', 'เช้าวันเสาร์'],
  },
  {
    id: 'w-floor', slug: 'chan-sip-sam', title: 'ชั้นสิบสาม', kind: 'manga', category: 'ลึกลับ',
    synopsis: 'ลิฟต์อาคารสำนักงานไม่มีปุ่มชั้นสิบสาม แต่บางคืนมันหยุดตรงนั้นเอง (เรื่องย่อตัวอย่าง)',
    cover_tone: 'blue', author_id: 'a-005', author_name: 'ทีมแปลสมมติ', price_full_work: 14,
    chapters: 5, free: 2, prices: [1, 2, 2], is_new: true,
    views: 15800, score: 4.4, rating_count: 72, rank_daily: 540, rank_weekly: 600, rank_monthly: 600, latestMin: 15,
    titles: ['ปุ่มที่ไม่มี', 'ประตูเปิด', 'โถงไฟนีออน', 'ป้ายห้องประชุม', 'ชั้นที่ถูกลบ'],
  },
  {
    id: 'w-drama2', slug: 'thanon-lang-rongrian', title: 'ถนนหลังโรงเรียน', kind: 'novel', category: 'ดราม่า',
    synopsis: 'ถนนหลังโรงเรียนสั้นกว่าที่แผนที่บอก และมีป้ายรถเมล์ที่ไม่มีใครจำได้ว่าเคยมี (เรื่องย่อตัวอย่าง)',
    cover_tone: 'warm', author_id: 'a-004', author_name: 'ฝนโปรย', price_full_work: null,
    chapters: 5, free: 2, prices: [1, 2, 1], is_new: true,
    views: 8900, score: 4.3, rating_count: 40, rank_daily: 460, rank_weekly: 500, rank_monthly: 500, latestMin: 300,
    titles: ['ป้ายรถเมล์', 'กระดิ่งเลิกเรียน', 'ร่มสีเทา', 'ทางลัด', 'คิวที่ไม่มีรถ'],
  },
  {
    id: 'w-act2', slug: 'praeng-lek-klang-mueang', title: 'แปลงเหล็กกลางเมือง', kind: 'manga', category: 'แอ็กชัน',
    synopsis: 'ลานก่อสร้างร้างกลางเมืองกลายเป็นสนามประลองของคนส่งของกะดึก (เรื่องย่อตัวอย่าง)',
    cover_tone: 'warm', author_id: 'a-003', author_name: 'ตัวอย่างมังงะ', price_full_work: 18,
    chapters: 6, free: 2, prices: [2, 1, 3], popular: true,
    views: 60200, score: 4.5, rating_count: 330, rank_daily: 350, rank_weekly: 2100, rank_monthly: 5000, latestMin: 600,
    titles: ['กะดึก', 'หมวกนิรภัย', 'เครนหยุด', 'กล่องที่ห้ามเปิด', 'ทางลง', 'ไฟไซต์งาน'],
  },
];

function build(spec: Spec): { work: Work; chapters: Chapter[] } {
  const chapters: Chapter[] = [];
  for (let n = 1; n <= spec.chapters; n += 1) {
    const isFree = n <= spec.free;
    const follow = !isFree && (spec.follow ?? []).includes(n);
    const price = isFree ? 0 : spec.prices[(n - spec.free - 1) % spec.prices.length];
    const minutes = spec.latestMin + (spec.chapters - n) * 8 * 60;
    chapters.push({
      id: `${spec.id}-c${n}`,
      work_id: spec.id,
      number: n,
      title: spec.titles[n - 1] ?? `ตอนที่ ${n}`,
      pricing: isFree ? 'free' : 'coin',
      coin_price: price,
      follow_free: follow,
      published_at: agoIso(minutes),
      status: 'published',
      is_example_data: true,
    });
  }
  const work: Work = {
    id: spec.id,
    slug: spec.slug,
    title: spec.title,
    synopsis: spec.synopsis,
    kind: spec.kind,
    category: spec.category,
    tags: [spec.category],
    rating: spec.rating ?? 'ทั่วไป',
    status: spec.status ?? 'published',
    cover_tone: spec.cover_tone,
    author_id: spec.author_id,
    author_name: spec.author_name,
    price_full_work: spec.price_full_work,
    chapter_count: spec.chapters,
    free_episode_count: spec.free,
    views: spec.views,
    score: spec.score,
    rating_count: spec.rating_count,
    rank_daily: spec.rank_daily,
    rank_weekly: spec.rank_weekly,
    rank_monthly: spec.rank_monthly,
    latest_at: chapters[chapters.length - 1]?.published_at ?? agoIso(spec.latestMin),
    is_example_data: true,
    featured: spec.featured,
    popular: spec.popular,
    is_new: spec.is_new,
  };
  return { work, chapters };
}

const built = SPECS.map(build);
export const seedWorks: Work[] = built.map((b) => b.work);
export const seedChapters: Chapter[] = built.flatMap((b) => b.chapters);

const cafeBody1 = `ฝนพรำลงมาตั้งแต่หัวค่ำ ถนนซอยแคบๆ ข้างสถานีรถไฟดูเงียบกว่าทุกคืนที่เธอเคยเดินผ่าน

ป้ายไม้สีซีดเขียนด้วยลายมือว่า "เปิดหลังเที่ยงคืน" แขวนเอียงๆ เหนือประตูบานเก่า สีน้ำตาลเข้มลอกเป็นด่าง

เธอผลักประตูเข้าไป กระดิ่งเล็กๆ ดังขึ้นหนึ่งครั้ง อากาศภายในอุ่นและมีกลิ่นกาแฟคั่วใหม่ๆ ปนกับส้มโอที่เพิ่งผ่า

"ยินดีต้อนรับ" เสียงจากหลังเคาน์เตอร์พูดแผ่วๆ "กฎมีข้อเดียว — เล่าความลับหนึ่งอย่าง แล้วค่อยสั่ง"

เธอยืนนิ่งอยู่ครู่หนึ่ง มองแก้วเรียงบนชั้น แล้วพูดเสียงเบาว่า "ฉันไม่ได้ตั้งใจจะมาที่นี่"`;

const cafeBody2 = `บาริสต้าคนนั้นไม่ได้ถามอะไรต่อ แค่พยักหน้า แล้วเริ่มบดเมล็ดกาแฟด้วยมือ ประหนึ่งว่าคำสารภาพของเธอเป็นเพียงรายการในใบสั่ง

"กาแฟไม่มีน้ำตาล" เธอพูดตามหลัง ความลับยังค้างอยู่ในลำคอ

เขาวางแก้วขาวขุ่นลงตรงหน้า ฟองนมบางๆ เป็นรูปพระจันทร์เสี้ยว "ที่นี่ไม่ใส่น้ำตาลอยู่แล้ว" เขายิ้มบางๆ "ลูกค้าส่วนใหญ่มาเพื่อความขม"

เธอจิบช้าๆ ความขมกลมกล่อมตัดกับกลิ่นส้มโอบนเคาน์เตอร์ ฝนข้างนอกหนาขึ้น กระจกหน้าต่างเป็นฝ้า

"คุณเคยเล่าความลับไหม" เธอถาม

เขาเช็ดแก้วโดยไม่มองขึ้น "ทุกคืน ก่อนปิดร้าน ฉันเล่าให้เก้าอี้ว่างๆ ฟัง — มันจำได้ดีกว่าคน"`;

const cafeBody3 = `ลูกค้าประจำคนแรกมาตอนสองทุ่มครึ่ง ชายวัยกลางคนเสื้อคลุมเปียกฝน วางร่มพับไว้ข้างประตูเหมือนเคยทำมาเป็นร้อยครั้ง

"เหมือนเดิม" เขาพูด บาริสต้าพยักหน้าโดยไม่ถามกฎ

เธอมองจากมุมโต๊ะริมหน้าต่าง ชายคนนั้นนั่งตำแหน่งเดิมทุกคืน — ที่สามจากซ้าย หันหลังให้กระจก

เมื่อแก้วมาถึง เขาพูดเสียงเบาจนเกือบกลืนฝน "วันนี้ฉันเกือบโทรหาเธออีกแล้ว"

ไม่มีใครในร้านหันมามอง กฎของที่นี่คือได้ยินแล้วเก็บไว้ เหมือนเก็บเมล็ดกาแฟในโหลมืด

บาริสต้าส่งสายตาให้เธอแป๊บหนึ่ง เหมือนบอกว่านี่คือเหตุผลที่คาเฟ่เปิดหลังเที่ยงคืน — ไม่ใช่เพื่อกาแฟ แต่เพื่อความลับที่ไม่รู้จะวางไว้ที่ไหน

เธอจดลงในสมุดเล่มเล็กโดยไม่ตั้งใจ: "ลูกค้าประจำคนแรก · ที่นั่งสามจากซ้าย · เกือบโทร"

กระดิ่งที่ประตูดังอีกครั้ง ลมเย็นพัดเข้ามาพร้อมคนใหม่ และกฎข้อเดิมยังแขวนอยู่เหนือเคาน์เตอร์`;

function fillerBody(workTitle: string, chapterTitle: string, n: number): string {
  return `นี่คือข้อความตัวอย่างสำหรับ "${workTitle}" ตอนที่ ${n} — ${chapterTitle}

ตัวละครตัวอย่างเดินผ่านซอยแคบในเมืองสมมติ ลมเย็นพัดผ่านป้ายไฟนีออนที่กะพริบไม่สม่ำเสมอ

"เราควรไปต่อไหม" ใครบางคนถาม

ไม่มีคำตอบชัดเจน มีเพียงเสียงฝนบนหลังคาสังกะสี และกลิ่นดินหลังฝน

ข้อความนี้เป็นตัวอย่างเพื่อทดสอบหน้าอ่านนิยายในโหมด mock · ไม่ใช่เนื้อหาจริงของผลิตภัณฑ์

ย่อหน้าถัดไปยังคงเป็นตัวอย่างซ้ำ เพื่อให้ความยาวพอสำหรับเลื่อนอ่านบนมือถือ และตรวจสอบระยะบรรทัดตามดีไซน์`;
}

const cafeBodies: Record<string, string> = {
  'w-cafe-c1': cafeBody1,
  'w-cafe-c2': cafeBody2,
  'w-cafe-c3': cafeBody3,
};

export const seedContents: ChapterContent[] = seedChapters
  .filter((c) => seedWorks.find((w) => w.id === c.work_id)?.kind === 'novel')
  .map((c) => {
    const work = seedWorks.find((w) => w.id === c.work_id)!;
    return { chapter_id: c.id, body: cafeBodies[c.id] ?? fillerBody(work.title, c.title, c.number) };
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

const commentTime = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3600_000).toISOString();

export const seedComments: ReaderComment[] = [
  {
    id: 'cmt-1', chapter_id: 'w-cafe-c1', user_id: 'user-reader-seed', display_name: 'คนอ่านตัวอย่าง',
    body: 'บรรยากาศร้านดีมาก อ่านแล้วได้กลิ่นกาแฟเลย', created_at: commentTime(5), like_count: 12, liked_by_me: false,
  },
  {
    id: 'cmt-2', chapter_id: 'w-cafe-c1', user_id: 'user-reader-seed-2', display_name: 'แก้วเปล่า',
    body: 'กฎข้อเดียวของร้านทำให้อยากอ่านต่อทันที', created_at: commentTime(2), like_count: 4, liked_by_me: false,
  },
  {
    id: 'cmt-3', chapter_id: 'w-island-c1', user_id: 'user-reader-seed', display_name: 'คนอ่านตัวอย่าง',
    body: 'แผงแรกสวย อยากรู้ว่าคนบนหาดคือใคร', created_at: commentTime(8), like_count: 9, liked_by_me: false,
  },
  {
    id: 'cmt-4', chapter_id: 'w-sword-c1', user_id: 'user-reader-seed-2', display_name: 'แก้วเปล่า',
    body: 'จังหวะต่อสู้ตอนเปิดเรื่องลื่น อ่านรวดเดียว', created_at: commentTime(1), like_count: 6, liked_by_me: false,
  },
  {
    id: 'cmt-5', chapter_id: 'w-kdt-c2', user_id: 'user-reader-seed', display_name: 'คนอ่านตัวอย่าง',
    body: 'คำสัญญาเก่าอันนี้เจ็บดี', created_at: commentTime(20), like_count: 3, liked_by_me: false,
  },
];

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_REFERRAL_CODE = 'TB7DEMO';
