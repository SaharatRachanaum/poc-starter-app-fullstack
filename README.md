# 🎓 ระบบบริหารจัดการคำขอทุนการศึกษา (Scholarship Management System)

ระบบสารสนเทศสำหรับการยื่นคำขอรับทุนการศึกษาสำหรับนักศึกษา และระบบบริหารจัดการ ตรวจสอบ พิจารณาอนุมัติคำขอสำหรับเจ้าหน้าที่ (Admin) พัฒนาขึ้นเพื่อใช้ในการประเมินผลงาน (POC)

---

## ✨ ฟีเจอร์หลักของระบบ (Key Features)

### 👤 ฝั่งนักศึกษา (User Portal)
* **ยื่นคำขอทุนการศึกษา:** ฟอร์มกรอกข้อมูลแบ่งเป็น 3 หมวดหมู่ (ข้อมูลส่วนตัว, รายละเอียดทุน, บัญชีธนาคาร) พร้อมระบบตรวจสอบความถูกต้อง (Validation)
* **นโยบาย PDPA:** หน้าต่างแสดงข้อกำหนดความยินยอมการเก็บรวบรวมข้อมูลส่วนบุคคล (PDPA Consent) ก่อนส่งคำขอ
* **ตัวเลือกชั้นปี:** รองรับตัวเลือกชั้นปีตั้งแต่ ปี 1 ถึง ปี 8 ครบถ้วน

### 🔐 ฝั่งเจ้าหน้าที่ (Admin Dashboard)
* **Auth Guard & Security:** ระบบเข้าสู่ระบบ (Login/Logout) ป้องกันการเข้าถึงหน้าจัดการด้วย Token (/admin/dashboard)
* **Dashboard & Charts:** การ์ดสรุปจำนวนคำขอทั้งหมด, รอพิจารณา, อนุมัติ และปฏิเสธ พร้อมกราฟโดนัท (สัดส่วนสถานะ) และกราฟแท่ง (จำนวนแยกตามประเภททุน)
* **ตารางรายการ & Pagination:** แสดงรายการคำขอ พร้อมระบบแบ่งหน้า (10 รายการ/หน้า)
* **ค้นหา & กรองข้อมูล:** ค้นหาด้วยชื่อ/รหัส/อีเมล และกรองตามสถานะหรือประเภททุนได้ทันที
* **การพิจารณาคำขอ:** ออนุมัติหรือปฏิเสธคำขอ พร้อมระบุหมายเหตุการพิจารณา (Admin Remark) ผ่าน Custom Modal
* **การจัดการข้อมูล:** รองรับการเพิ่มคำขอแทนนักศึกษา (Admin Create) และการแก้ไขข้อมูลคำขอ
* **Soft Delete:** อนุญาตให้ลบคำเฉพาะรายการที่อยู่ในสถานะ PENDING เท่านั้น พร้อมยืนยันก่อนลบ
* **Data Masking & Export:** ปิดบังเลขที่บัญชีธนาคารเพื่อความปลอดภัย (Masked Account) และฟังก์ชัน Export ข้อมูลทั้งหมดเป็นไฟล์ CSV

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Chart.js / React-ChartJS-2
* **Backend:** Go (Golang) / RESTful API 
* **Database:** PostgreSQL
* **Containerization:** Docker & Docker Compose

---

## ⚙️ วิธีการติดตั้งและรันระบบ (Installation & Setup)

คุณสามารถรันระบบทั้งระบบ (Frontend, Backend, Database) ได้อย่างรวดเร็วผ่าน Docker Compose:

1. **Clone Repository / เปิดโปรเจกต์ในเครื่อง**
   ```bash
   git clone [https://github.com/SaharatRachanaum/poc-starter-app-fullstack.git](https://github.com/SaharatRachanaum/poc-starter-app-fullstack.git)
   cd poc-starter-app-fullstack
   ```

2. **กำหนดค่า Environment Variables**
   ตรวจสอบหรือตั้งค่าไฟล์ .env สำหรับเชื่อมต่อระบบ (เช่น POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET) และตั้งค่า NEXT_PUBLIC_API_URL ให้ชี้ไปยัง Backend API

3. **รันระบบด้วย Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **เข้าใช้งานระบบผ่าน Browser**
   - หน้าเว็บฝั่งนักศึกษา (User): http://localhost:3000
   - หน้าเข้าสู่ระบบเจ้าหน้าที่ (Admin Login): http://localhost:3000/login

---

## 🔑 บัญชีผู้ใช้ทดสอบระบบ (Test Credentials & Seed Data)

* **URL เข้าสู่ระบบ:** `http://localhost:3000/login`
* **Username:** `admin`
* **Password:** `admin123` *(หรือรหัสผ่านที่กำหนดไว้ในไฟล์ seed.js)*
* **Seed Data:** ระบบเตรียมข้อมูลคำขอทุนตัวอย่างไว้ในระบบ 25+ รายการ ครอบคลุมทุกประเภททุนและทุกสถานะ (`PENDING`, `APPROVED`, `REJECTED`)

 **คำสั่งสำหรับสั่ง Seed ข้อมูลใหม่ด้วยตนเอง (Manual Seed):**
* **Automatic Seed:** เมื่อรันคำสั่ง `docker-compose up --build` ระบบจะทำการ Migrate Structure และนำเข้าข้อมูล Seed Data ให้อัตโนมัติทันที
* **Manual Seed:**  หากต้องการสั่งสร้างตารางและ Seed ข้อมูลตัวอย่างเข้าฐานข้อมูลใหม่ด้วยตนเอง สามารถเข้าไปที่โฟลเดอร์ `backend` แล้วรันคำสั่ง:
   ```bash
   cd backend
   npx prisma db seed
   ```

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)
   ```
      ├── src/
      │   ├── app/
      │   │   ├── page.js             # หน้าแรก (แบบฟอร์มยื่นคำขอของนักศึกษา + PDPA)
      │   │   ├── login/
      │   │   │   └── page.js         # หน้าเข้าสู่ระบบสำหรับเจ้าหน้าที่
      │   │   └── admin/
      │   │       └── dashboard/
      │   │           └── page.js     # หน้า Admin Dashboard (กราฟ, ตาราง, Modal จัดการ)
      │   └── ...
      ├── Dockerfile                  # สำหรับ Build Frontend Next.js
      ├── docker-compose.yml          # ไฟล์รวม Docker Services
      └── README.md                   # คู่มือการใช้งานระบบ
   ```