/**
 * Seed mock catalog into live Supabase (auth users + authors + works + chapters).
 * Usage: DATABASE_URL=postgresql://... node backend/scripts/seed-mock-catalog.mjs
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = process.env.MIGRATIONS_DIR
  ? path.resolve(process.env.MIGRATIONS_DIR)
  : path.resolve(__dirname, '../migrations');

function detUuid(key) {
  const bytes = Buffer.from(crypto.createHash('sha256').update(`stockmanga:${key}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const DEMO_PASSWORD = 'demo1234';
const COVER_DEFAULT = '/covers/default.svg';

const USERS = [
  { key: 'demo', email: 'demo@example.com', display_name: 'ผู้อ่านตัวอย่าง', referral: 'SM7DEMO' },
  { key: 'writer', email: 'writer@example.com', display_name: 'นามปากกาตัวอย่าง' },
  { key: 'a002', email: 'author2@example.com', display_name: 'นักเขียนสมมติ' },
  { key: 'a003', email: 'author3@example.com', display_name: 'ตัวอย่างมังงะ' },
  { key: 'a004', email: 'author4@example.com', display_name: 'ฝนโปรย' },
  { key: 'a005', email: 'author5@example.com', display_name: 'ทีมแปลสมมติ' },
  { key: 'reader2', email: 'reader2@example.com', display_name: 'แก้วเปล่า' },
];

const AUTHORS = [
  { key: 'a-001', userKey: 'writer', display_name: 'นามปากกาตัวอย่าง', bio: 'นักเขียนตัวอย่าง · บัญชี writer@example.com' },
  { key: 'a-002', userKey: 'a002', display_name: 'นักเขียนสมมติ', bio: 'ผู้เขียนสมมติสำหรับ demo' },
  { key: 'a-003', userKey: 'a003', display_name: 'ตัวอย่างมังงะ', bio: 'ทีมมังงะตัวอย่าง' },
  { key: 'a-004', userKey: 'a004', display_name: 'ฝนโปรย', bio: 'นิยายบรรยากาศฝน' },
  { key: 'a-005', userKey: 'a005', display_name: 'ทีมแปลสมมติ', bio: 'ทีมแปลตัวอย่าง' },
];

const CATEGORIES = [
  { slug: 'manhwa', name: 'Manhwa มังงะเกาหลี', icon_key: 'book', sort_order: 1 },
  { slug: 'featured', name: 'มังงะแนะนำ', icon_key: 'sparkles', sort_order: 2 },
  { slug: 'romance', name: 'Romance โรแมนติก', icon_key: 'heart', sort_order: 3 },
  { slug: 'adult', name: 'Adult ผู้ใหญ่', icon_key: 'ghost', sort_order: 4 },
  { slug: 'fantasy', name: 'Fantasy แฟนตาซี', icon_key: 'sparkles', sort_order: 5 },
  { slug: 'drama', name: 'Drama ดราม่า', icon_key: 'masks', sort_order: 6 },
  { slug: 'yaoi', name: 'Yaoi มังงะวาย', icon_key: 'heart', sort_order: 7 },
  { slug: 'ecchi', name: 'Ecchi ลามก', icon_key: 'ghost', sort_order: 8 },
  { slug: 'action', name: 'Action แอ็คชั่น', icon_key: 'zap', sort_order: 9 },
  { slug: 'comedy', name: 'Comedy ตลก', icon_key: 'masks', sort_order: 10 },
  { slug: 'manga', name: 'Manga มังงะญี่ปุ่น', icon_key: 'book', sort_order: 11 },
  { slug: 'doujin', name: 'Doujin โดจิน', icon_key: 'book', sort_order: 12 },
  { slug: 'horror', name: 'Horror สยองขวัญ', icon_key: 'ghost', sort_order: 13 },
  { slug: 'sci-fi', name: 'Sci-Fi ไซไฟ', icon_key: 'rocket', sort_order: 14 },
  { slug: 'mystery', name: 'Mystery ลึกลับ', icon_key: 'search', sort_order: 15 },
];

const CAT_MAP = {
  โรแมนติก: 'Romance โรแมนติก',
  แฟนตาซี: 'Fantasy แฟนตาซี',
  สยองขวัญ: 'Horror สยองขวัญ',
  ดราม่า: 'Drama ดราม่า',
  แอ็กชัน: 'Action แอ็คชั่น',
  ไซไฟ: 'Sci-Fi ไซไฟ',
  ลึกลับ: 'Mystery ลึกลับ',
};

const SPECS = [
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

function fillerBody(workTitle, chapterTitle, n) {
  return `นี่คือข้อความตัวอย่างสำหรับ "${workTitle}" ตอนที่ ${n} — ${chapterTitle}

ตัวละครตัวอย่างเดินผ่านซอยแคบในเมืองสมมติ ลมเย็นพัดผ่านป้ายไฟนีออนที่กะพริบไม่สม่ำเสมอ

"เราควรไปต่อไหม" ใครบางคนถาม

ไม่มีคำตอบชัดเจน มีเพียงเสียงฝนบนหลังคาสังกะสี และกลิ่นดินหลังฝน

ข้อความนี้เป็นตัวอย่างเพื่อทดสอบหน้าอ่านนิยายในโหมด real DB · ไม่ใช่เนื้อหาจริงของผลิตภัณฑ์

ย่อหน้าถัดไปยังคงเป็นตัวอย่างซ้ำ เพื่อให้ความยาวพอสำหรับเลื่อนอ่านบนมือถือ และตรวจสอบระยะบรรทัดตามดีไซน์`;
}

const CAFE_BODIES = { 1: cafeBody1, 2: cafeBody2, 3: cafeBody3 };

function agoIso(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

async function runSqlFile(client, fileName) {
  const full = path.join(migrationsDir, fileName);
  if (!fs.existsSync(full)) throw new Error(`missing ${fileName}`);
  const sql = fs.readFileSync(full, 'utf8');
  console.log('migration', fileName);
  await client.query(sql);
  console.log('ok', fileName);
}

async function ensureUser(client, user) {
  const id = detUuid(`user:${user.key}`);
  const existing = await client.query('select id from auth.users where id=$1 or email=$2', [id, user.email]);
  if (existing.rowCount) {
    const uid = existing.rows[0].id;
    await client.query(
      `update public.profiles set display_name=$2 where id=$1`,
      [uid, user.display_name],
    );
    return uid;
  }
  await client.query(
    `insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
      crypt($3, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', $4::text),
      now(), now(), '', '', '', ''
    )`,
    [id, user.email, DEMO_PASSWORD, user.display_name],
  );
  await client.query(
    `insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      $1::uuid, $1::uuid,
      jsonb_build_object('sub', $3::text, 'email', $2::text, 'email_verified', true),
      'email', $3::text, now(), now(), now()
    ) on conflict do nothing`,
    [id, user.email, id],
  );
  await client.query(
    `update public.profiles set display_name=$2 where id=$1`,
    [id, user.display_name],
  );
  return id;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });
  await client.connect();
  console.log('connected');

  await client.query(`create extension if not exists pgcrypto`);

  // Apply pending migrations (idempotent where possible)
  for (const f of ['0005_categories.sql', '0006_gold_diamond.sql', '0007_catalog_demo_columns.sql']) {
    try {
      await runSqlFile(client, f);
    } catch (err) {
      console.warn('migration warn', f, err.message);
    }
  }

  // Categories — deactivate legacy Thai-only rows then upsert bilingual set
  await client.query(`update public.categories set active=false where slug not in (${CATEGORIES.map((_, i) => `$${i + 1}`).join(',')})`, CATEGORIES.map((c) => c.slug));
  for (const c of CATEGORIES) {
    await client.query(
      `insert into public.categories (id, name, slug, icon_key, sort_order, active)
       values ($1,$2,$3,$4,$5,true)
       on conflict (slug) do update set
         name=excluded.name, icon_key=excluded.icon_key, sort_order=excluded.sort_order, active=true, updated_at=now()`,
      [detUuid(`cat:${c.slug}`), c.name, c.slug, c.icon_key, c.sort_order],
    );
  }
  console.log('categories', CATEGORIES.length);

  // Coin packs parity with mock
  const packs = [
    ['10000000-0000-4000-8000-000000000050', 'แพ็กเริ่มต้น', 50, 0, 50],
    ['10000000-0000-4000-8000-000000000100', 'แพ็กแนะนำ', 100, 10, 100],
    ['10000000-0000-4000-8000-000000000300', 'แพ็กกลาง', 300, 50, 300],
    ['10000000-0000-4000-8000-000000000500', 'แพ็กใหญ่', 500, 100, 500],
    ['10000000-0000-4000-8000-000000001000', 'แพ็กผู้อ่านประจำ', 1000, 250, 1000],
  ];
  for (const [id, name, coins, bonus, thb] of packs) {
    await client.query(
      `insert into public.coin_packs (id, name, coins, bonus_coins, amount_thb, active, is_example_data)
       values ($1,$2,$3,$4,$5,true,true)
       on conflict (id) do update set name=excluded.name, coins=excluded.coins, bonus_coins=excluded.bonus_coins, amount_thb=excluded.amount_thb, active=true`,
      [id, name, coins, bonus, thb],
    );
  }

  await client.query(`update public.platform_settings set writer_share_bps=9000, mock_enabled=true where singleton`);

  const userIds = {};
  for (const u of USERS) {
    userIds[u.key] = await ensureUser(client, u);
    console.log('user', u.email, userIds[u.key]);
  }

  // Referral code for demo reader
  await client.query(
    `insert into public.referral_codes (user_id, code) values ($1,'SM7DEMO')
     on conflict (user_id) do update set code=excluded.code`,
    [userIds.demo],
  );

  const authorIds = {};
  for (const a of AUTHORS) {
    const id = detUuid(`author:${a.key}`);
    authorIds[a.key] = id;
    const uid = userIds[a.userKey];
    await client.query(
      `insert into public.authors (id, user_id, display_name, bio, status, contract_version, contract_accepted_at, approved_at)
       values ($1,$2,$3,$4,'approved','demo-v1',now(),now())
       on conflict (user_id) do update set
         display_name=excluded.display_name, bio=excluded.bio, status='approved', approved_at=coalesce(public.authors.approved_at, now())
       returning id`,
      [id, uid, a.display_name, a.bio],
    );
    // If conflict on user_id kept old id, sync map
    const row = await client.query(`select id from public.authors where user_id=$1`, [uid]);
    authorIds[a.key] = row.rows[0].id;
  }
  console.log('authors', Object.keys(authorIds).length);

  // Clear previous example catalog (by slug)
  const slugs = SPECS.map((s) => s.slug);
  const existingWorks = await client.query(
    `select id from public.works where slug = any($1::text[]) or is_example_data=true`,
    [slugs],
  );
  const workIdsToClear = existingWorks.rows.map((r) => r.id);
  if (workIdsToClear.length) {
    await client.query(`delete from public.comment_likes where comment_id in (select id from public.comments where chapter_id in (select id from public.chapters where work_id = any($1::uuid[])))`, [workIdsToClear]);
    await client.query(`delete from public.comments where chapter_id in (select id from public.chapters where work_id = any($1::uuid[]))`, [workIdsToClear]);
    await client.query(`delete from public.chapter_contents where chapter_id in (select id from public.chapters where work_id = any($1::uuid[]))`, [workIdsToClear]);
    await client.query(`delete from public.chapter_pages where chapter_id in (select id from public.chapters where work_id = any($1::uuid[]))`, [workIdsToClear]);
    await client.query(`delete from public.chapters where work_id = any($1::uuid[])`, [workIdsToClear]);
    await client.query(`delete from public.works where id = any($1::uuid[])`, [workIdsToClear]);
    console.log('cleared works', workIdsToClear.length);
  }

  let chapterCount = 0;
  const chapterIdByKey = {};

  for (const spec of SPECS) {
    const workId = detUuid(`work:${spec.id}`);
    const authorId = authorIds[spec.author_id];
    const category = CAT_MAP[spec.category] ?? spec.category;
    const rating = spec.rating === '18+' ? '18+' : 'general';
    // RLS work_visible hides 18+ — store adult works as general for demo catalog visibility,
    // keep tag in tags[] so UI can still show badge via tags if needed. Prefer rating column for badge:
    // Use general so catalog lists them; frontend maps rating.
    const dbRating = 'general';
    const completed = spec.status === 'completed';
    const latestAt = agoIso(spec.latestMin);

    await client.query(
      `insert into public.works (
        id, author_id, kind, title, slug, synopsis, cover_path, cover_url, cover_tone,
        category, tags, rating, status, price_full_work, completed, published_at,
        free_episode_count, author_name, chapter_count, views, score, rating_count,
        rank_daily, rank_weekly, rank_monthly, latest_at, featured, popular, is_new, is_example_data
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,'published',$13,$14,$15,
        $16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,$28,true
      )`,
      [
        workId, authorId, spec.kind, spec.title, spec.slug, spec.synopsis,
        null, COVER_DEFAULT, spec.cover_tone,
        category, [category, ...(rating === '18+' ? ['18+'] : [])], dbRating,
        spec.price_full_work, completed, latestAt,
        spec.free, spec.author_name, spec.chapters, spec.views, spec.score, spec.rating_count,
        spec.rank_daily, spec.rank_weekly, spec.rank_monthly, latestAt,
        !!spec.featured, !!spec.popular, !!spec.is_new,
      ],
    );

    for (let n = 1; n <= spec.chapters; n += 1) {
      const chapterId = detUuid(`chapter:${spec.id}:c${n}`);
      chapterIdByKey[`${spec.id}-c${n}`] = chapterId;
      const isFree = n <= spec.free;
      const follow = !isFree && (spec.follow ?? []).includes(n);
      const price = isFree ? 0 : spec.prices[(n - spec.free - 1) % spec.prices.length];
      const minutes = spec.latestMin + (spec.chapters - n) * 8 * 60;
      const publishAt = agoIso(minutes);
      const title = spec.titles[n - 1] ?? `ตอนที่ ${n}`;

      await client.query(
        `insert into public.chapters (
          id, work_id, number, title, pricing, coin_price, status, publish_at, content_type, follow_to_read
        ) values ($1,$2,$3,$4,$5,$6,'published',$7,$8,$9)`,
        [chapterId, workId, n, title, isFree ? 'free' : 'coin', price, publishAt, spec.kind, follow],
      );
      chapterCount += 1;

      if (spec.kind === 'novel') {
        const body = spec.id === 'w-cafe' && CAFE_BODIES[n]
          ? CAFE_BODIES[n]
          : fillerBody(spec.title, title, n);
        await client.query(
          `insert into public.chapter_contents (chapter_id, body) values ($1,$2)`,
          [chapterId, body],
        );
      } else {
        for (let p = 1; p <= 3; p += 1) {
          await client.query(
            `insert into public.chapter_pages (id, chapter_id, page_number, storage_path)
             values ($1,$2,$3,$4)`,
            [detUuid(`page:${spec.id}:c${n}:p${p}`), chapterId, p, `mock/${spec.id}/${n}/p${p}.png`],
          );
        }
      }
    }
  }
  console.log('works', SPECS.length, 'chapters', chapterCount);

  // Seed comments on free chapters
  const comments = [
    { key: 'cmt-1', chapter: 'w-cafe-c1', user: 'demo', body: 'บรรยากาศร้านดีมาก อ่านแล้วได้กลิ่นกาแฟเลย', hours: 5 },
    { key: 'cmt-2', chapter: 'w-cafe-c1', user: 'reader2', body: 'กฎข้อเดียวของร้านทำให้อยากอ่านต่อทันที', hours: 2 },
    { key: 'cmt-3', chapter: 'w-island-c1', user: 'demo', body: 'แผงแรกสวย อยากรู้ว่าคนบนหาดคือใคร', hours: 8 },
    { key: 'cmt-4', chapter: 'w-sword-c1', user: 'reader2', body: 'จังหวะต่อสู้ตอนเปิดเรื่องลื่น อ่านรวดเดียว', hours: 1 },
    { key: 'cmt-5', chapter: 'w-kdt-c2', user: 'demo', body: 'คำสัญญาเก่าอันนี้เจ็บดี', hours: 20 },
  ];
  for (const c of comments) {
    const chapterId = chapterIdByKey[c.chapter];
    if (!chapterId) continue;
    await client.query(
      `insert into public.comments (id, chapter_id, user_id, body, created_at)
       values ($1,$2,$3,$4,$5)
       on conflict (id) do nothing`,
      [detUuid(`comment:${c.key}`), chapterId, userIds[c.user], c.body, agoIso(c.hours * 60)],
    );
  }
  console.log('comments', comments.length);

  const counts = await client.query(`
    select
      (select count(*)::int from public.works where is_example_data) as works,
      (select count(*)::int from public.chapters) as chapters,
      (select count(*)::int from public.authors where status='approved') as authors,
      (select count(*)::int from public.categories where active) as categories,
      (select count(*)::int from auth.users) as users
  `);
  console.log('DONE', counts.rows[0]);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
