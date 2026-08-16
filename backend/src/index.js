const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Middleware ตรวจสอบ JWT Token สำหรับ Admin
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Unauthorized: ไม่พบ Token' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Token ไม่ถูกต้องหรือหมดอายุ' });
    req.user = user;
    next();
  });
};

// -------------------------------------------------------------
// 1. PUBLIC API (สำหรับนักศึกษายื่นคำขอทุน ไม่ต้องผ่าน Token)
// -------------------------------------------------------------
app.post('/api/public/requests', async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      facultyDepartment,
      yearLevel,
      gpax,
      email,
      type,
      amountRequested,
      bankAccountNumber,
      reason,
      pdpaConsent,
    } = req.body;

    // 1. Validation ข้อมูลบังคับ
    if (
      !studentId ||
      !fullName ||
      !facultyDepartment ||
      !yearLevel ||
      !gpax ||
      !email ||
      !amountRequested ||
      !bankAccountNumber ||
      !reason
    ) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลในแบบฟอร์มให้ครบถ้วนทุกช่อง' });
    }

    // 2. Validation รหัสนักศึกษา (10 หลัก)
    if (!/^\d{10}$/.test(String(studentId).trim())) {
      return res.status(400).json({ message: 'รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก' });
    }

    // 3. Validation GPAX (0.00 - 4.00)
    const gpaxNum = parseFloat(gpax);
    if (isNaN(gpaxNum) || gpaxNum < 0 || gpaxNum > 4.0) {
      return res.status(400).json({ message: 'เกรดเฉลี่ย (GPAX) ต้องอยู่ระหว่าง 0.00 - 4.00' });
    }

    // 4. Validation อีเมล
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }

    // 5. Validation จำนวนเงิน > 0
    if (parseFloat(amountRequested) <= 0) {
      return res.status(400).json({ message: 'จำนวนเงินที่ขอต้องมากกว่า 0 บาท' });
    }

    // 6. Validation PDPA
    if (pdpaConsent !== true) {
      return res.status(400).json({ message: 'กรุณายืนยันการยินยอมข้อตกลง PDPA ก่อนส่งคำขอ' });
    }

    const newRequest = await prisma.scholarshipRequest.create({
      data: {
        studentId: String(studentId).trim(),
        fullName: String(fullName).trim(),
        facultyDepartment: String(facultyDepartment).trim(),
        yearLevel: parseInt(yearLevel, 10),
        gpax: gpaxNum,
        email: String(email).trim(),
        type: type || 'NEED_BASED',
        amountRequested: parseFloat(amountRequested),
        bankAccountNumber: String(bankAccountNumber).trim(),
        reason: String(reason).trim(),
        pdpaConsent: true,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'ยื่นคำขอทุนการศึกษาเรียบร้อยแล้ว',
      data: newRequest,
    });
  } catch (error) {
    console.error('Public submit request error:', error);
    return res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาดในการยื่นคำขอทุน' });
  }
});

// -------------------------------------------------------------
// 2. ADMIN APIs (สำหรับเจ้าหน้าที่ ต้องผ่าน Authentication)
// -------------------------------------------------------------

// API Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอก Username และ Password' });
    }

    const admin = await prisma.user.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
});

// API Admin Dashboard Summary
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    const activeWhere = { deletedAt: null };

    const totalRequests = await prisma.scholarshipRequest.count({ where: activeWhere });
    const pendingCount = await prisma.scholarshipRequest.count({ where: { ...activeWhere, status: 'PENDING' } });
    const approvedCount = await prisma.scholarshipRequest.count({ where: { ...activeWhere, status: 'APPROVED' } });
    const rejectedCount = await prisma.scholarshipRequest.count({ where: { ...activeWhere, status: 'REJECTED' } });

    const typeGroup = await prisma.scholarshipRequest.groupBy({
      by: ['type'],
      where: activeWhere,
      _count: { _all: true },
      _sum: { amountRequested: true },
    });

    const typeStats = typeGroup.map((item) => ({
      type: item.type,
      count: item._count._all,
      totalAmount: item._sum.amountRequested || 0,
    }));

    res.json({
      summary: { totalRequests, pendingCount, approvedCount, rejectedCount },
      typeStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API Get All Requests (กรอง deletedAt: null + Sorting id asc)
app.get('/api/admin/requests', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, type, search, sortBy = 'id', order = 'asc' } = req.query;

    const where = { deletedAt: null };
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sortOrder = order.toLowerCase() === 'desc' ? 'desc' : 'asc';
    const orderBy = { [sortBy]: sortOrder };

    const [requests, total] = await Promise.all([
      prisma.scholarshipRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.scholarshipRequest.count({ where }),
    ]);

    res.json({
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API Create Request โดย Admin (รับเรื่องแทน)
app.post('/api/admin/requests', authenticateToken, async (req, res) => {
  try {
    const {
      fullName,
      studentId,
      email,
      gpax,
      amountRequested,
      type,
      bankAccountNumber,
      reason,
      facultyDepartment,
      yearLevel,
      pdpaConsent,
    } = req.body;

    if (!fullName || !studentId || !email || !gpax || !amountRequested || !bankAccountNumber) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    if (pdpaConsent !== true) {
      return res.status(400).json({ message: 'กรุณายืนยันการยินยอมข้อตกลง PDPA ก่อนส่งคำขอ' });
    }

    const newRequest = await prisma.scholarshipRequest.create({
      data: {
        fullName,
        studentId,
        email,
        gpax: parseFloat(gpax),
        amountRequested: parseFloat(amountRequested),
        type: type || 'NEED_BASED',
        bankAccountNumber,
        reason: reason || '',
        status: 'PENDING',
        facultyDepartment: facultyDepartment || 'คณะวิทยาศาสตร์',
        yearLevel: yearLevel ? parseInt(yearLevel) : 1,
        pdpaConsent: true,
      },
    });

    return res.status(201).json({
      message: 'สร้างคำขอทุนการศึกษาสำเร็จ',
      data: newRequest,
    });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({ message: error.message || 'เกิดข้อผิดพลาดในการสร้างคำขอทุน' });
  }
});

// API Update Request Status (PATCH)
app.patch('/api/admin/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment, adminRemark } = req.body;

    const updated = await prisma.scholarshipRequest.update({
      where: { id: parseInt(id) },
      data: { 
        status, 
        adminRemark: adminRemark || adminComment || null
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API Edit Full Request Data (PUT)
app.put('/api/admin/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, studentId, email, gpax, amountRequested, type } = req.body;

    const updated = await prisma.scholarshipRequest.update({
      where: { id: parseInt(id) },
      data: {
        fullName,
        studentId,
        ...(email && { email }),
        gpax: parseFloat(gpax),
        amountRequested: parseFloat(amountRequested),
        type,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// API Delete Request (Soft Delete เฉพาะสถานะ PENDING)
app.delete('/api/admin/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const target = await prisma.scholarshipRequest.findFirst({
      where: { id: parseInt(id), deletedAt: null },
    });

    if (!target) return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการลบ' });
    if (target.status !== 'PENDING') {
      return res.status(400).json({ message: 'อนุญาตให้ลบเฉพาะรายการที่อยู่ในสถานะ PENDING เท่านั้น' });
    }

    await prisma.scholarshipRequest.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});