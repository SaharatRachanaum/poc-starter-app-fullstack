'use client';

import { useState } from 'react';

export default function PublicFormPage() {
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    facultyDepartment: '',
    yearLevel: '',
    gpax: '',
    email: '',
    type: '',
    amountRequested: '',
    bankAccountNumber: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  // State สำหรับควบคุม PDPA Modal
  const [showPdpaModal, setShowPdpaModal] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // ตรวจสอบ Validation เบื้องต้นของแบบฟอร์ม
  const validate = () => {
    const newErrors = {};

    if (!/^\d{10}$/.test(formData.studentId.trim())) {
      newErrors.studentId = 'รหัสนักศึกษาต้องเป็นตัวเลข 10 หลักเท่านั้น';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'กรุณากรอกชื่อ-นามสกุล';
    } else if (/\d/.test(formData.fullName)) {
      newErrors.fullName = 'ชื่อ-นามสกุลต้องไม่มีตัวเลขผสม';
    }

    if (!formData.facultyDepartment.trim()) {
      newErrors.facultyDepartment = 'กรุณากรอกคณะและสาขาวิชา';
    }

    if (!formData.yearLevel) {
      newErrors.yearLevel = 'กรุณาเลือกชั้นปี';
    }

    const gpaxNum = parseFloat(formData.gpax);
    if (isNaN(gpaxNum) || gpaxNum < 0 || gpaxNum > 4.0) {
      newErrors.gpax = 'GPAX ต้องอยู่ระหว่าง 0.00 ถึง 4.00';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง (เช่น student@psu.ac.th)';
    }

    if (!formData.type) {
      newErrors.type = 'กรุณาเลือกประเภททุน';
    }

    const amountNum = parseFloat(formData.amountRequested);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amountRequested = 'จำนวนเงินที่ขอต้องมากกว่า 0 บาท';
    }

    if (!/^\d{10,12}$/.test(formData.bankAccountNumber.trim())) {
      newErrors.bankAccountNumber = 'เลขที่บัญชีต้องเป็นตัวเลข 10-12 หลักเท่านั้น (ไม่ต้องใส่ขีด)';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'กรุณาระบุเหตุผลการขอทุน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // 1. กดปุ่มส่งคำขอ -> ถ้าผ่าน Validation ให้เปิด PDPA Modal
  const handleOpenPdpaModal = (e) => {
    e.preventDefault();
    setApiError(null);

    if (validate()) {
      setPdpaConsent(false); // Reset ค่า checkbox ทุกครั้งที่เปิด modal
      setShowPdpaModal(true);
    }
  };

  // 2. กดยืนยันใน PDPA Modal -> ส่งข้อมูลไปยัง API
  const handleFinalSubmit = async () => {
    if (!pdpaConsent) return;

    setLoading(true);
    setShowPdpaModal(false);

    try {
      const res = await fetch(`${API_URL}/api/public/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          studentId: formData.studentId.trim(),
          fullName: formData.fullName.trim(),
          facultyDepartment: formData.facultyDepartment.trim(),
          email: formData.email.trim(),
          bankAccountNumber: formData.bankAccountNumber.trim(),
          reason: formData.reason.trim(),
          yearLevel: parseInt(formData.yearLevel, 10),
          gpax: parseFloat(formData.gpax),
          amountRequested: parseFloat(formData.amountRequested),
          pdpaConsent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      }

      setSubmitSuccess(true);
      setFormData({
        studentId: '',
        fullName: '',
        facultyDepartment: '',
        yearLevel: '',
        gpax: '',
        email: '',
        type: '',
        amountRequested: '',
        bankAccountNumber: '',
        reason: '',
      });
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center justify-center font-sans antialiased">
      {/* Header Banner */}
      <div className="max-w-3xl w-full text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3 shadow-sm">
          <span>🎓</span>
          <span>มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          ระบบยื่นคำขอทุนการศึกษา
        </h1>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          งานสวัสดิการและทุนการศึกษา กองพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์
        </p>
      </div>

      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        {/* Banner แจ้งเตือนส่งสำเร็จ */}
        {submitSuccess && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h4 className="text-sm font-bold text-emerald-800">ยื่นคำขอทุนการศึกษาเรียบร้อยแล้ว</h4>
                <p className="text-xs text-emerald-600 mt-0.5">
                  คำขอของท่านอยู่ในสถานะ <b className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">"รอพิจารณา"</b> เจ้าหนาที่จะดำเนินการตรวจสอบต่อไป
                </p>
              </div>
            </div>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner แจ้งเตือน Error */}
        {apiError && (
          <div className="p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleOpenPdpaModal} className="space-y-6" noValidate>
          {/* หมวดที่ 1: ข้อมูลนักศึกษา */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
              <span>👤</span>
              <span>1. ข้อมูลส่วนตัวนักศึกษา</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  รหัสนักศึกษา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  maxLength={10}
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="เช่น 6410210318"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.studentId
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.studentId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.studentId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ-นามสกุล"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.fullName
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.fullName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  คณะ/สาขาวิชา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="facultyDepartment"
                  value={formData.facultyDepartment}
                  onChange={handleChange}
                  placeholder="เช่น คณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.facultyDepartment
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.facultyDepartment && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.facultyDepartment}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชั้นปี <span className="text-rose-500">*</span>
                </label>
                <select
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.yearLevel
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- เลือกชั้นปี --</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((yr) => (
                    <option key={yr} value={yr}>
                      ปี {yr}
                    </option>
                  ))}
                </select>
                {errors.yearLevel && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.yearLevel}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  GPAX <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.00"
                  name="gpax"
                  value={formData.gpax}
                  onChange={handleChange}
                  placeholder="0.00 - 4.00"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.gpax
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.gpax && <p className="text-[11px] text-rose-500 mt-1">{errors.gpax}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  อีเมล (PSU PASSPORT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="studentId@psu.ac.th"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.email
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* หมวดที่ 2: รายละเอียดทุนการศึกษา */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
              <span>💰</span>
              <span>2. รายละเอียดทุนการศึกษาที่ต้องการขอ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ประเภททุน <span className="text-rose-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.type
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- เลือกประเภททุน --</option>
                  <option value="NEED_BASED">ทุนขาดแคลนทุนทรัพย์</option>
                  <option value="ACADEMIC_EXCELLENCE">ทุนส่งเสริมการศึกษา (เรียนดี)</option>
                  <option value="WORK_STUDY">ทุนทำงานพิเศษ (นักศึกษาช่วยงาน)</option>
                  <option value="EMERGENCY">ทุนฉุกเฉิน / ช่วยเหลือกรณีพิเศษ</option>
                  <option value="STUDENT_ACTIVITY">ทุนกิจกรรมนักศึกษา</option>
                </select>
                {errors.type && <p className="text-[11px] text-rose-500 mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  จำนวนเงินที่ขอ (บาท) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="amountRequested"
                  min="1"
                  value={formData.amountRequested}
                  onChange={handleChange}
                  placeholder="ระบุจำนวนเงิน (> 0)"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                    errors.amountRequested
                      ? 'border-rose-400 focus:ring-rose-300'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.amountRequested && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.amountRequested}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                เหตุผลการขอทุน <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="reason"
                rows={3}
                value={formData.reason}
                onChange={handleChange}
                placeholder="ระบุเหตุผลและความจำเป็นในการยื่นขอรับทุนการศึกษา"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white resize-none ${
                  errors.reason
                    ? 'border-rose-400 focus:ring-rose-300'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.reason && <p className="text-[11px] text-rose-500 mt-1">{errors.reason}</p>}
            </div>
          </div>

          {/* หมวดที่ 3: ข้อมูลทางการเงิน */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🏦</span>
              <span>3. ข้อมูลบัญชีธนาคารสำหรับรับโอนเงินทุน</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                เลขที่บัญชีธนาคาร <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="bankAccountNumber"
                maxLength={12}
                value={formData.bankAccountNumber}
                onChange={handleChange}
                placeholder="กรอกเฉพาะตัวเลข 10-12 หลัก (ไม่ต้องใส่ขีด)"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition bg-white ${
                  errors.bankAccountNumber
                    ? 'border-rose-400 focus:ring-rose-300'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.bankAccountNumber && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.bankAccountNumber}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'กำลังดำเนินการ...' : 'ตรวจสอบและยื่นคำขอทุน'}</span>
              {!loading && <span>➔</span>}
            </button>
          </div>
        </form>
      </div>

      {/* =================================------------------------ */}
      {/* PDPA CONSENT MODAL */}
      {/* =================================------------------------ */}
      {showPdpaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center space-x-2 border-b pb-3 mb-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  หนังสือยินยอมการเก็บและใช้ข้อมูลส่วนบุคคล (PDPA)
                </h3>
                <p className="text-[11px] text-gray-500">
                  มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่
                </p>
              </div>
            </div>

            {/* เนื้อหานโยบาย PDPA (เลื่อนอ่านได้) */}
            <div className="bg-slate-50 p-4 rounded-xl border text-xs text-gray-600 space-y-3 overflow-y-auto max-h-60 leading-relaxed text-justify">
              <p className="font-semibold text-gray-800">
                เรียน นักศึกษาผู้ขอรับทุนการศึกษา
              </p>
              <p>
                มหาวิทยาลัยสงขลานครินทร์ ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ทางกองพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์ จึงขอแจ้งนโยบายและขอความยินยอมในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน ดังนี้:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  <b>วัตถุประสงค์ในการเก็บรวบรวม:</b> เพื่อใช้ในการตรวจสอบคุณสมบัติ ดำเนินการพิจารณาอนุมัติทุนการศึกษา ติดต่อประสานงาน และโอนเงินทุนการศึกษาเข้าบัญชีธนาคารของท่าน
                </li>
                <li>
                  <b>ข้อมูลที่มีการจัดเก็บ:</b> รหัสนักศึกษา, ชื่อ-นามสกุล, คณะ/สาขาวิชา, ชั้นปี, เกรดเฉลี่ย (GPAX), อีเมล, เลขที่บัญชีธนาคาร และข้อมูลประกอบการพิจารณาคำขอทุน
                </li>
                <li>
                  <b>ระยะเวลาในการจัดเก็บ:</b> ข้อมูลจะถูกจัดเก็บไว้ตลอดระยะเวลาที่ท่านศึกษาอยู่ และจัดเก็บต่อตามระเบียบการจัดเก็บเอกสารทางราชการ
                </li>
                <li>
                  <b>การเปิดเผยข้อมูล:</b> มหาวิทยาลัยจะเก็บรักษาข้อมูลของท่านเป็นความลับ และเปิดเผยเฉพาะเจ้าหน้าที่ที่เกี่ยวข้อง หรือหน่วยงาน/เจ้าของทุนการศึกษาตามวัตถุประสงค์เท่านั้น
                </li>
              </ol>
            </div>

            {/* Checkbox ยินยอม PDPA */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-start space-x-2.5 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                <input
                  type="checkbox"
                  id="pdpaModalCheck"
                  checked={pdpaConsent}
                  onChange={(e) => setPdpaConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="pdpaModalCheck"
                  className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed"
                >
                  ข้าพเจ้าได้อ่านและเข้าใจข้อความข้างต้นโดยละเอียดแล้ว และยินยอมให้มหาวิทยาลัยสงขลานครินทร์ เก็บ รวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของข้าพเจ้าตามวัตถุประสงค์ที่ระบุ <span className="text-rose-500">*</span>
                </label>
              </div>
            </div>

            {/* ปุ่ม Actions */}
            <div className="mt-5 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowPdpaModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!pdpaConsent}
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                ยืนยันและส่งคำขอทุน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}