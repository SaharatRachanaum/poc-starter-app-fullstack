const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. สร้างบัญชี Admin (Username: admin, Password: admin123)
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash, // <--- เพิ่มตรงนี้เพื่อให้ overwrite hash ทุกครั้งที่ seed
      fullName: 'เจ้าหน้าที่ ทุนการศึกษา',
    },
    create: {
      username: 'admin',
      passwordHash,
      fullName: 'เจ้าหน้าที่ ทุนการศึกษา',
    },
  });

  // 2. ข้อมูลคำขอทุนตัวอย่าง 25 รายการ (กระจายหลายประเภทและสถานะ)
  const sampleRequests = [
    { studentId: '6510110001', fullName: 'สมชาย สายเรียน', facultyDepartment: 'วิศวกรรมศาสตร์/คอมพิวเตอร์', yearLevel: 3, gpax: 3.85, email: '6510110001@psu.ac.th', type: 'ACADEMIC_EXCELLENCE', amountRequested: 15000, bankAccountNumber: '123-4-56789-0', reason: 'เกรดเฉลี่ยตรงตามเกณฑ์ทุนเรียนดี', pdpaConsent: true, status: 'APPROVED', adminRemark: 'อนุมัติเนื่องจากผลการเรียนดีเยี่ยม' },
    { studentId: '6610210012', fullName: 'วิภาดา ดีเยี่ยม', facultyDepartment: 'วิทยาศาสตร์/เทคโนโลยีสารสนเทศ', yearLevel: 2, gpax: 3.40, email: '6610210012@psu.ac.th', type: 'NEED_BASED', amountRequested: 10000, bankAccountNumber: '987-6-54321-0', reason: 'ครอบครัวได้รับผลกระทบจากภัยธรรมชาติ', pdpaConsent: true, status: 'APPROVED', adminRemark: 'ผ่านการตรวจสอบคุณสมบัติ' },
    { studentId: '6410310045', fullName: 'กิตติศักดิ์ มั่นคง', facultyDepartment: 'นิติศาสตร์', yearLevel: 4, gpax: 2.75, email: '6410310045@psu.ac.th', type: 'WORK_STUDY', amountRequested: 5000, bankAccountNumber: '555-1-23456-7', reason: 'ประสงค์ช่วยงานห้องสมุดยามเย็น', pdpaConsent: true, status: 'APPROVED', adminRemark: 'จัดสรรลงงานห้องสมุดคณะ' },
    { studentId: '6710410088', fullName: 'ณิชาภา รักดี', facultyDepartment: 'พยาบาลศาสตร์', yearLevel: 1, gpax: 3.10, email: '6710410088@psu.ac.th', type: 'EMERGENCY', amountRequested: 8000, bankAccountNumber: '111-2-33344-5', reason: 'ค่ารักษาพยาบาลฉุกเฉินของผู้ปกครอง', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510510002', fullName: 'ธนกฤต ชัยชนะ', facultyDepartment: 'บริหารธุรกิจ/การบัญชี', yearLevel: 3, gpax: 2.10, email: '6510510002@psu.ac.th', type: 'NEED_BASED', amountRequested: 12000, bankAccountNumber: '444-5-66677-8', reason: 'ขาดแคลนค่าอุปกรณ์การเรียน', pdpaConsent: true, status: 'REJECTED', adminRemark: 'เกรดเฉลี่ยไม่อยู่ในเกณฑ์ขั้นต่ำ' },
    { studentId: '6610110099', fullName: 'ปิยะวัฒน์ เด่นดวง', facultyDepartment: 'วิศวกรรมศาสตร์/ไฟฟ้า', yearLevel: 2, gpax: 3.90, email: '6610110099@psu.ac.th', type: 'ACADEMIC_EXCELLENCE', amountRequested: 15000, bankAccountNumber: '222-3-44455-6', reason: 'ยื่นขอทุนเรียนดีประจำปี', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6410610033', fullName: 'กมลชนก ใจดี', facultyDepartment: 'ศิลปศาสตร์/ภาษาอังกฤษ', yearLevel: 4, gpax: 3.25, email: '6410610033@psu.ac.th', type: 'STUDENT_ACTIVITY', amountRequested: 6000, bankAccountNumber: '333-8-99900-1', reason: 'ทุนสนับสนุนการแข่งขันทักษะภาษา', pdpaConsent: true, status: 'APPROVED' },
    { studentId: '6710210011', fullName: 'ศุภชัย มีสุข', facultyDepartment: 'วิทยาศาสตร์/เคมี', yearLevel: 1, gpax: 2.80, email: '6710210011@psu.ac.th', type: 'NEED_BASED', amountRequested: 10000, bankAccountNumber: '777-1-11223-4', reason: 'รายได้ครอบครัวลดลง', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510710054', fullName: 'อรอนงค์ สวยงาม', facultyDepartment: 'เภสัชศาสตร์', yearLevel: 3, gpax: 3.65, email: '6510710054@psu.ac.th', type: 'WORK_STUDY', amountRequested: 5000, bankAccountNumber: '888-9-00112-3', reason: 'ช่วยงานวิจัยในห้องปฏิบัติการ', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6610810021', fullName: 'พีรพงษ์ กล้าหาญ', facultyDepartment: 'แพทยศาสตร์', yearLevel: 2, gpax: 3.50, email: '6610810021@psu.ac.th', type: 'EMERGENCY', amountRequested: 10000, bankAccountNumber: '666-4-55511-2', reason: 'ประสบอุบัติเหตุระหว่างเดินทาง', pdpaConsent: true, status: 'APPROVED' },
    { studentId: '6410110123', fullName: 'ชยุตม์ ล้ำเลิศ', facultyDepartment: 'วิศวกรรมศาสตร์/โยธา', yearLevel: 4, gpax: 2.95, email: '6410110123@psu.ac.th', type: 'STUDENT_ACTIVITY', amountRequested: 7000, bankAccountNumber: '999-0-12345-6', reason: 'นายกสโมสรนักศึกษา ขอทุนทำค่ายอาสา', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6710910005', fullName: 'มนัสวี พร้อมพรั่ง', facultyDepartment: 'ทรัพยากรธรรมชาติ', yearLevel: 1, gpax: 3.00, email: '6710910005@psu.ac.th', type: 'NEED_BASED', amountRequested: 15000, bankAccountNumber: '123-9-87654-3', reason: 'ค่าธรรมเนียมการศึกษาสูงเกินกำลัง', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510310077', fullName: 'วรเมธ คงกะพัน', facultyDepartment: 'นิติศาสตร์', yearLevel: 3, gpax: 2.45, email: '6510310077@psu.ac.th', type: 'NEED_BASED', amountRequested: 8000, bankAccountNumber: '456-7-89012-3', reason: 'ครอบครัวมีภาระหนี้สิน', pdpaConsent: true, status: 'REJECTED' },
    { studentId: '6610510044', fullName: 'กนกวรรณ เพริศแพร้ว', facultyDepartment: 'บริหารธุรกิจ/การตลาด', yearLevel: 2, gpax: 3.70, email: '6610510044@psu.ac.th', type: 'ACADEMIC_EXCELLENCE', amountRequested: 15000, bankAccountNumber: '789-0-12345-6', reason: 'สอบได้อันดับ 1 ของสาขา', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6410210089', fullName: 'ธีรยุทธ สุดยอด', facultyDepartment: 'วิทยาศาสตร์/ฟิสิกส์', yearLevel: 4, gpax: 3.15, email: '6410210089@psu.ac.th', type: 'WORK_STUDY', amountRequested: 5000, bankAccountNumber: '321-6-54321-0', reason: 'ช่วยงานผู้ช่วยสอนวิชา Lab', pdpaConsent: true, status: 'APPROVED' },
    { studentId: '6710110222', fullName: 'จิราพร อ่อนหวาน', facultyDepartment: 'วิศวกรรมศาสตร์/สิ่งแวดล้อม', yearLevel: 1, gpax: 3.30, email: '6710110222@psu.ac.th', type: 'NEED_BASED', amountRequested: 10000, bankAccountNumber: '654-3-21098-7', reason: 'ขอทุนสนับสนุนเฟรชชี่ปี 1', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510610011', fullName: 'นนทพัทธ์ ชัยสิทธิ์', facultyDepartment: 'ศิลปศาสตร์/ไทย', yearLevel: 3, gpax: 2.85, email: '6510610011@psu.ac.th', type: 'STUDENT_ACTIVITY', amountRequested: 4000, bankAccountNumber: '987-1-23456-0', reason: 'สนับสนุนการแสดงละครเวทีคณะ', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6610710033', fullName: 'ปรียานุช รัตนพร', facultyDepartment: 'เภสัชศาสตร์', yearLevel: 2, gpax: 3.80, email: '6610710033@psu.ac.th', type: 'ACADEMIC_EXCELLENCE', amountRequested: 15000, bankAccountNumber: '147-2-58369-0', reason: 'ผลการเรียนดีเด่นต่อเนื่อง', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6410810055', fullName: 'พงศกร จริงจัง', facultyDepartment: 'แพทยศาสตร์', yearLevel: 4, gpax: 3.60, email: '6410810055@psu.ac.th', type: 'EMERGENCY', amountRequested: 12000, bankAccountNumber: '258-3-69147-0', reason: 'บ้านประสบอัคคีภัย', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6710310012', fullName: 'อนันต์ สุขเสริฐ', facultyDepartment: 'นิติศาสตร์', yearLevel: 1, gpax: 2.90, email: '6710310012@psu.ac.th', type: 'WORK_STUDY', amountRequested: 5000, bankAccountNumber: '369-1-47258-0', reason: 'ช่วยงานธุรการสำนักงานคณบดี', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510410099', fullName: 'สิริกร มั่นใจ', facultyDepartment: 'พยาบาลศาสตร์', yearLevel: 3, gpax: 3.45, email: '6510410099@psu.ac.th', type: 'NEED_BASED', amountRequested: 10000, bankAccountNumber: '741-8-52963-0', reason: 'ผู้ปกครองถูกเลิกจ้างงาน', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6610110333', fullName: 'กิตติพงษ์ ทรงพลัง', facultyDepartment: 'วิศวกรรมศาสตร์/เครื่องกล', yearLevel: 2, gpax: 3.10, email: '6610110333@psu.ac.th', type: 'STUDENT_ACTIVITY', amountRequested: 8000, bankAccountNumber: '852-9-63741-0', reason: 'ขอทุนแข่งรถประหยัดเชื้อเพลิง', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6410510111', fullName: 'นภัสสร แสงสว่าง', facultyDepartment: 'บริหารธุรกิจ/การเงิน', yearLevel: 4, gpax: 3.95, email: '6410510111@psu.ac.th', type: 'ACADEMIC_EXCELLENCE', amountRequested: 15000, bankAccountNumber: '963-7-41852-0', reason: 'ยื่นขอทุนเกียรตินิยมอันดับ 1', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6710210077', fullName: 'ภาณุเดช มีชัย', facultyDepartment: 'วิทยาศาสตร์/ชีววิทยา', yearLevel: 1, gpax: 2.60, email: '6710210077@psu.ac.th', type: 'NEED_BASED', amountRequested: 9000, bankAccountNumber: '159-3-57284-0', reason: 'ขาดแคลนค่าที่พักหอพัก', pdpaConsent: true, status: 'PENDING' },
    { studentId: '6510910022', fullName: 'ชลธิชา นำโชค', facultyDepartment: 'ทรัพยากรธรรมชาติ', yearLevel: 3, gpax: 3.35, email: '6510910022@psu.ac.th', type: 'WORK_STUDY', amountRequested: 5000, bankAccountNumber: '357-1-59284-0', reason: 'ช่วยงานแปลงสาธิตการเกษตร', pdpaConsent: true, status: 'PENDING' },
  ];

  for (const req of sampleRequests) {
    await prisma.scholarshipRequest.create({ data: req });
  }

  console.log('Seed data inserted successfully!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());