'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const TYPE_MAP = {
  NEED_BASED: { label: 'ทุนขาดแคลนทุนทรัพย์', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  ACADEMIC_EXCELLENCE: { label: 'ทุนเรียนดี', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  WORK_STUDY: { label: 'ทุนทำงานแลกเปลี่ยน', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  EMERGENCY: { label: 'ทุนฉุกเฉิน', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  STUDENT_ACTIVITY: { label: 'ทุนกิจกรรมนักศึกษา', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [typeStats, setTypeStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPdpaModalForAdmin, setShowPdpaModalForAdmin] = useState(false);

  // Custom Remark Modal State
  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    targetId: null,
    targetStatus: null,
    remarkText: '',
  });

  // Custom Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    item: null,
  });

  const [newRequest, setNewRequest] = useState({
    fullName: '',
    studentId: '',
    email: '',
    gpax: '',
    amountRequested: '',
    type: 'NEED_BASED',
    bankAccountNumber: '',
    reason: '',
    yearLevel: '1',
    facultyDepartment: '',
    pdpaConsent: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('username');

    if (!token || token === 'undefined' || token === 'null') {
      router.replace('/login');
      return;
    }

    setUser(storedUser || 'Admin');
    setIsCheckingAuth(false);
    fetchDashboard(token);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isCheckingAuth) {
      fetchRequests(token, currentPage);
    }
  }, [currentPage, statusFilter, typeFilter, search, isCheckingAuth]);

  const fetchDashboard = async (authToken) => {
    try {
      const dashRes = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setSummary(dashData.summary || null);
        setTypeStats(Array.isArray(dashData.typeStats) ? dashData.typeStats : []);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    }
  };

  const fetchRequests = async (authToken, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        sortBy: 'id',
        order: 'asc',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
      });

      const reqRes = await fetch(`${API_URL}/api/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.data && reqData.pagination) {
          setRequests(reqData.data);
          setTotalPages(reqData.pagination.totalPages);
          setTotalItems(reqData.pagination.total);
        } else {
          setRequests(Array.isArray(reqData) ? reqData : []);
        }
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.replace('/login');
  };

  const executeStatusChange = async (id, newStatus, remark) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminRemark: remark }),
      });
      if (res.ok) {
        setViewingItem(null);
        fetchDashboard(token);
        fetchRequests(token, currentPage);
      } else {
        alert('ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const executeDelete = async (item) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/admin/requests/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('ลบข้อมูลเรียบร้อย');
        setViewingItem(null);
        setDeleteModal({ isOpen: false, item: null });
        fetchDashboard(token);
        fetchRequests(token, currentPage);
      } else {
        const err = await res.json();
        alert(err.message || 'ไม่สามารถลบรายการได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = {
        fullName: editingItem.fullName,
        studentId: editingItem.studentId,
        email: editingItem.email,
        gpax: parseFloat(editingItem.gpax),
        amountRequested: parseFloat(editingItem.amountRequested),
        type: editingItem.type,
        yearLevel: parseInt(editingItem.yearLevel || 1),
        facultyDepartment: editingItem.facultyDepartment,
        bankAccountNumber: editingItem.bankAccountNumber,
        reason: editingItem.reason,
      };

      const res = await fetch(`${API_URL}/api/admin/requests/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('แก้ไขข้อมูลเรียบร้อย');
        const updatedItem = { ...editingItem, ...payload };
        setEditingItem(null);
        setViewingItem(updatedItem);
        fetchRequests(token, currentPage);
      } else {
        const err = await res.json();
        alert(err.message || 'แก้ไขข้อมูลไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleCreateSubmitDirect = async () => {
    if (!newRequest.pdpaConsent) {
      alert('กรุณายืนยันการยินยอมข้อตกลง PDPA ก่อนส่งคำขอ');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const payload = {
        ...newRequest,
        gpax: parseFloat(newRequest.gpax),
        amountRequested: parseFloat(newRequest.amountRequested),
        yearLevel: parseInt(newRequest.yearLevel),
      };

      const res = await fetch(`${API_URL}/api/admin/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('เพิ่มคำขอทุนเรียบร้อย');
        setShowCreateModal(false);
        setNewRequest({
          fullName: '',
          studentId: '',
          email: '',
          gpax: '',
          amountRequested: '',
          type: 'NEED_BASED',
          bankAccountNumber: '',
          reason: '',
          yearLevel: '1',
          facultyDepartment: '',
          pdpaConsent: false,
        });
        fetchDashboard(token);
        fetchRequests(token, 1);
      } else {
        const err = await res.json();
        alert(err.message || 'สร้างคำขอไม่สำเร็จ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการสร้างคำขอ');
    }
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setExporting(true);
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: totalItems > 0 ? totalItems : 10000,
        sortBy: 'id',
        order: 'asc',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(search && { search }),
      });

      const res = await fetch(`${API_URL}/api/admin/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        alert('เกิดข้อผิดพลาดในการดึงข้อมูลเพื่อ Export');
        return;
      }

      const resData = await res.json();
      const exportData = resData.data || (Array.isArray(resData) ? resData : []);

      if (exportData.length === 0) {
        alert('ไม่มีข้อมูลสำหรับ Export');
        return;
      }

      const headers = ['ID', 'Student ID', 'Full Name', 'Email', 'Faculty Department', 'Year Level', 'GPAX', 'Type', 'Amount', 'Status', 'PDPA Consent', 'Bank Account', 'Reason', 'Admin Remark', 'Created At'];
      const rows = exportData.map((item) => [
        item.id,
        `"${item.studentId || ''}"`,
        `"${(item.fullName || '').replace(/"/g, '""')}"`,
        `"${(item.email || '').replace(/"/g, '""')}"`,
        `"${(item.facultyDepartment || '').replace(/"/g, '""')}"`,
        item.yearLevel || 1,
        item.gpax || '',
        item.type || '',
        item.amountRequested || 0,
        item.status || '',
        item.pdpaConsent ? 'YES' : 'NO',
        `"${item.bankAccountNumber || ''}"`,
        `"${(item.reason || '').replace(/"/g, '""')}"`,
        `"${(item.adminRemark || '').replace(/"/g, '""')}"`,
        `"${item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : ''}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `scholarship_requests_all_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export CSV Error:', err);
      alert('เกิดข้อผิดพลาดระหว่าง Export CSV');
    } finally {
      setExporting(false);
    }
  };

  const maskBankAccount = (acc) => {
    if (!acc || acc.length < 6) return acc || '-';
    return acc.slice(0, 3) + '-XXX-' + acc.slice(-3);
  };

  const doughnutData = {
    labels: ['รอพิจารณา', 'อนุมัติแล้ว', 'ไม่อนุมัติ'],
    datasets: [
      {
        data: [
          summary?.pendingCount || 0,
          summary?.approvedCount || 0,
          summary?.rejectedCount || 0,
        ],
        backgroundColor: ['#eab308', '#22c55e', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const barLabels = Object.values(TYPE_MAP).map((item) => item.label);
  const barCounts = Object.keys(TYPE_MAP).map((key) => {
    const found = typeStats.find((s) => s.type === key);
    return found ? found.count : 0;
  });

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'จำนวนคำขอ (รายการ)',
        data: barCounts,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex items-center space-x-3">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
            PSU
          </span>
          <h1 className="text-xl font-bold text-gray-800">
            ระบบบริหารจัดการคำขอทุนการศึกษา (Admin)
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            สวัสดี, <b>{user}</b>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-sm px-3 py-1.5 rounded-lg border border-red-200 transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">คำขอทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-800">{summary.totalRequests ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-sm text-gray-500">รอพิจารณา</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.pendingCount ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-500">อนุมัติแล้ว</p>
            <p className="text-2xl font-bold text-green-600">{summary.approvedCount ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-sm text-gray-500">ไม่อนุมัติ</p>
            <p className="text-2xl font-bold text-red-600">{summary.rejectedCount ?? 0}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl shadow flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-gray-700 mb-3 self-start">
            🍩 สัดส่วนสถานะคำขอทุน
          </h3>
          <div className="w-48 h-48">
            <Doughnut data={doughnutData} options={{ maintainAspectRatio: true }} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow md:col-span-2">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            📊 จำนวนคำขอแยกตามประเภททุน
          </h3>
          <div className="h-48">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-800">รายการคำขอทุน</h2>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="ค้นหาชื่อ / รหัส / อีเมล..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">ทุกสถานะ</option>
              <option value="PENDING">รอพิจารณา</option>
              <option value="APPROVED">อนุมัติ</option>
              <option value="REJECTED">ไม่อนุมัติ</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">ทุกประเภททุน</option>
              {Object.keys(TYPE_MAP).map((key) => (
                <option key={key} value={key}>
                  {TYPE_MAP[key].label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"
            >
              <span>+</span> เพิ่มคำขอ
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1"
            >
              <span>📥</span> {exporting ? 'กำลัง Export...' : 'Export CSV (ทั้งหมด)'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="p-3 border-b">เลขที่</th>
                <th className="p-3 border-b">รหัส-ชื่อนักศึกษา</th>
                <th className="p-3 border-b">ประเภททุน</th>
                <th className="p-3 border-b">จำนวนเงิน</th>
                <th className="p-3 border-b">เลขบัญชี (Masked)</th>
                <th className="p-3 border-b">สถานะ</th>
                <th className="p-3 border-b text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    ไม่พบรายการข้อมูล
                  </td>
                </tr>
              ) : (
                requests.map((item) => {
                  const typeInfo = TYPE_MAP[item.type] || {
                    label: item.type,
                    color: 'bg-gray-100 text-gray-700 border-gray-200',
                  };
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 border-b transition">
                      <td className="p-3">#{item.id}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {item.studentId} <br />
                        <span className="text-xs text-gray-500">{item.fullName}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-xs border font-medium ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-800">
                        {(item.amountRequested || 0).toLocaleString()} ฿
                      </td>
                      <td className="p-3 text-xs font-mono">
                        {maskBankAccount(item.bankAccountNumber)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : item.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setViewingItem(item)}
                          title="ดูรายละเอียด"
                          className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-xs px-3 py-1.5 rounded-lg transition font-medium"
                        >
                          รายละเอียด
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>
            แสดงหน้า {currentPage} จาก {totalPages || 1} (ทั้งหมด {totalItems} รายการ)
          </span>
          <div className="flex space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs"
            >
              ก่อนหน้า
            </button>
            <button
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50 text-xs"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VIEW DETAILS MODAL (คลิกพื้นที่ว่างด้านนอกเพื่อปิดได้) */}
      {/* ========================================================= */}
      {viewingItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setViewingItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  คำขอทุนการศึกษา #{viewingItem.id}
                </h3>
                <p className="text-xs text-gray-500">
                  ยื่นคำขอเมื่อ: {new Date(viewingItem.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  viewingItem.status === 'APPROVED'
                    ? 'bg-green-100 text-green-700'
                    : viewingItem.status === 'REJECTED'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {viewingItem.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">ชื่อ-นามสกุล</p>
                  <p className="text-sm font-semibold text-gray-800">{viewingItem.fullName}</p>
                  {viewingItem.email && (
                    <p className="text-xs text-blue-600 mt-0.5">{viewingItem.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400">รหัสนักศึกษา (ปี {viewingItem.yearLevel || 1})</p>
                  <p className="text-sm font-semibold text-gray-800">{viewingItem.studentId}</p>
                </div>
              </div>

              {viewingItem.facultyDepartment && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                  <p className="text-gray-400 mb-0.5">คณะ / สาขาวิชา</p>
                  <p className="font-semibold text-gray-800">{viewingItem.facultyDepartment}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div>
                  <p className="text-xs text-gray-500">เกรด (GPAX)</p>
                  <p className="text-base font-bold text-blue-700">{viewingItem.gpax}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">จำนวนเงินที่ขอ</p>
                  <p className="text-base font-bold text-blue-700">
                    {(viewingItem.amountRequested || 0).toLocaleString()} ฿
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ประเภททุน</p>
                  <p className="text-xs font-bold text-blue-700 mt-1">
                    {TYPE_MAP[viewingItem.type]?.label || viewingItem.type}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-xs">
                <span className="text-emerald-800">ยินยอมข้อตกลง PDPA:</span>
                <span className="font-bold text-emerald-600">
                  {viewingItem.pdpaConsent ? '✓ ยินยอมแล้ว' : '✗ ไม่ได้ยินยอม'}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">เลขที่บัญชีธนาคาร</p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded-lg border text-gray-700">
                  {viewingItem.bankAccountNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">เหตุผลในการขอทุน</p>
                <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-600 leading-relaxed max-h-24 overflow-y-auto">
                  {viewingItem.reason || 'ไม่ได้ระบุเหตุผล'}
                </div>
              </div>

              {viewingItem.adminRemark && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">หมายเหตุการพิจารณา</p>
                  <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 text-xs">
                    {viewingItem.adminRemark}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex flex-wrap justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => setViewingItem(null)}
                className="px-4 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-xs font-medium transition"
              >
                ปิดหน้าต่าง
              </button>

              <div className="flex gap-1.5">
                {viewingItem.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => {
                        const itemToEdit = viewingItem;
                        setViewingItem(null);
                        setEditingItem(itemToEdit);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => {
                        setRemarkModal({
                          isOpen: true,
                          targetId: viewingItem.id,
                          targetStatus: 'APPROVED',
                          remarkText: '',
                        });
                      }}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => {
                        setRemarkModal({
                          isOpen: true,
                          targetId: viewingItem.id,
                          targetStatus: 'REJECTED',
                          remarkText: '',
                        });
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      ปฏิเสธ
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, item: viewingItem })}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                    >
                      ลบ
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic py-1.5 px-2 bg-gray-50 rounded-lg border">
                    🔒 สิ้นสุดการพิจารณาแล้ว
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT MODAL (ดีไซน์เดียวกับหน้า User ครบทุกช่อง + ยกเลิกกลับมา Details) */}
      {/* ========================================================= */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => {
            const currentEdit = editingItem;
            setEditingItem(null);
            setViewingItem(currentEdit);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  แก้ไขข้อมูลคำขอ #{editingItem.id}
                </h3>
                <p className="text-[11px] text-gray-500">
                  ปรับปรุงข้อมูลคำขอทุนการศึกษาของนักศึกษา
                </p>
              </div>
              <button
                onClick={() => {
                  const currentEdit = editingItem;
                  setEditingItem(null);
                  setViewingItem(currentEdit);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
              {/* หมวดที่ 1 */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>👤</span>
                  <span>1. ข้อมูลส่วนตัวนักศึกษา</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      รหัสนักศึกษา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editingItem.studentId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, studentId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.fullName || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fullName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      คณะ / สาขาวิชา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingItem.facultyDepartment || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, facultyDepartment: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        ชั้นปี <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={editingItem.yearLevel || 1}
                        onChange={(e) => setEditingItem({ ...editingItem, yearLevel: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="1">ปี 1</option>
                        <option value="2">ปี 2</option>
                        <option value="3">ปี 3</option>
                        <option value="4">ปี 4</option>
                        <option value="5">ปี 5</option>
                        <option value="6">ปี 6</option>
                        <option value="7">ปี 7</option>
                        <option value="8">ปี 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        GPAX <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        value={editingItem.gpax ?? ''}
                        onChange={(e) => setEditingItem({ ...editingItem, gpax: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    อีเมลนักศึกษา (PSU PASSPORT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editingItem.email || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  />
                </div>
              </div>

              {/* หมวดที่ 2 */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>💰</span>
                  <span>2. รายละเอียดทุนการศึกษาที่ต้องการขอ</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ประเภททุน <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editingItem.type || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {Object.keys(TYPE_MAP).map((key) => (
                        <option key={key} value={key}>
                          {TYPE_MAP[key].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      จำนวนเงิน (บาท) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingItem.amountRequested || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, amountRequested: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    เหตุผลในการขอทุน <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="2"
                    value={editingItem.reason || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              {/* หมวดที่ 3 */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🏦</span>
                  <span>3. ข้อมูลบัญชีธนาคารสำหรับรับโอนเงินทุน</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    เลขที่บัญชีธนาคาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={editingItem.bankAccountNumber || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, bankAccountNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    const currentEdit = editingItem;
                    setEditingItem(null);
                    setViewingItem(currentEdit);
                  }}
                  className="px-4 py-2 border rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOM REMARK MODAL (ปุ่มตกลง/ยกเลิก แยกขาดจากกัน 100%) */}
      {/* ========================================================= */}
      {remarkModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-base font-bold text-gray-800 mb-1">
              ระบุหมายเหตุการพิจารณา ({remarkModal.targetStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'})
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              คุณสามารถระบุเหตุผลหรือข้อเสนอแนะเพิ่มเติม (ถ้ามี)
            </p>

            <textarea
              rows="3"
              value={remarkModal.remarkText}
              onChange={(e) =>
                setRemarkModal({ ...remarkModal, remarkText: e.target.value })
              }
              placeholder="ระบุหมายเหตุ (ไม่บังคับ)..."
              className="w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4 bg-gray-50"
            ></textarea>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() =>
                  setRemarkModal({ isOpen: false, targetId: null, targetStatus: null, remarkText: '' })
                }
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-semibold transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const { targetId, targetStatus, remarkText } = remarkModal;
                  setRemarkModal({ isOpen: false, targetId: null, targetStatus: null, remarkText: '' });
                  executeStatusChange(targetId, targetStatus, remarkText);
                }}
                className={`px-5 py-2 text-white rounded-xl text-xs font-semibold transition shadow-sm ${
                  remarkModal.targetStatus === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                ยืนยันการ{remarkModal.targetStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CUSTOM DELETE CONFIRM MODAL */}
      {/* ========================================================= */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-fadeIn">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-base font-bold text-gray-800 mb-1">
              ยืนยันการลบคำขอทุน
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              คุณต้องการลบคำขอของ <b>{deleteModal.item?.fullName}</b> ใช่หรือไม่?
            </p>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, item: null })}
                className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-xs font-semibold transition w-1/2"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => executeDelete(deleteModal.item)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm w-1/2"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  เพิ่มคำขอทุนการศึกษาใหม่ (โดยเจ้าหน้าที่)
                </h3>
                <p className="text-[11px] text-gray-500">
                  กรณีเจ้าหน้าที่รับเรื่องและบันทึกข้อมูลแทนนักศึกษา
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowPdpaModalForAdmin(true);
              }}
              className="space-y-4"
              noValidate
            >
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>👤</span>
                  <span>1. ข้อมูลส่วนตัวนักศึกษา</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      รหัสนักศึกษา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={newRequest.studentId}
                      onChange={(e) => setNewRequest({ ...newRequest, studentId: e.target.value })}
                      placeholder="เช่น 6410210318"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRequest.fullName}
                      onChange={(e) => setNewRequest({ ...newRequest, fullName: e.target.value })}
                      placeholder="กรอกชื่อ-นามสกุล"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      คณะ / สาขาวิชา <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น คณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์"
                      value={newRequest.facultyDepartment}
                      onChange={(e) => setNewRequest({ ...newRequest, facultyDepartment: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        ชั้นปี <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={newRequest.yearLevel}
                        onChange={(e) => setNewRequest({ ...newRequest, yearLevel: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="1">ปี 1</option>
                        <option value="2">ปี 2</option>
                        <option value="3">ปี 3</option>
                        <option value="4">ปี 4</option>
                        <option value="5">ปี 5</option>
                        <option value="6">ปี 6</option>
                        <option value="7">ปี 7</option>
                        <option value="8">ปี 8</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        GPAX <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        value={newRequest.gpax}
                        onChange={(e) => setNewRequest({ ...newRequest, gpax: e.target.value })}
                        placeholder="0.00 - 4.00"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    อีเมลนักศึกษา (PSU PASSPORT) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="studentId@psu.ac.th"
                    value={newRequest.email}
                    onChange={(e) => setNewRequest({ ...newRequest, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>💰</span>
                  <span>2. รายละเอียดทุนการศึกษาที่ต้องการขอ</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      ประเภททุน <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newRequest.type}
                      onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="NEED_BASED">ทุนขาดแคลนทุนทรัพย์</option>
                      <option value="ACADEMIC_EXCELLENCE">ทุนส่งเสริมการศึกษา (เรียนดี)</option>
                      <option value="WORK_STUDY">ทุนทำงานพิเศษ (นักศึกษาช่วยงาน)</option>
                      <option value="EMERGENCY">ทุนฉุกเฉิน / ช่วยเหลือกรณีพิเศษ</option>
                      <option value="STUDENT_ACTIVITY">ทุนกิจกรรมนักศึกษา</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      จำนวนเงินที่ขอ (บาท) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newRequest.amountRequested}
                      onChange={(e) => setNewRequest({ ...newRequest, amountRequested: e.target.value })}
                      placeholder="ระบุจำนวนเงิน (> 0)"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    เหตุผลในการขอทุน <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="2"
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    placeholder="ระบุเหตุผลและความจำเป็นในการยื่นขอรับทุน"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🏦</span>
                  <span>3. ข้อมูลบัญชีธนาคารสำหรับรับโอนเงินทุน</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    เลขที่บัญชีธนาคาร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={newRequest.bankAccountNumber}
                    onChange={(e) => setNewRequest({ ...newRequest, bankAccountNumber: e.target.value })}
                    placeholder="กรอกเฉพาะตัวเลข 10-12 หลัก (ไม่ต้องใส่ขีด)"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  ตรวจสอบและยื่นคำขอทุน ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPdpaModalForAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center space-x-2 border-b pb-3 mb-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  ยืนยันความยินยอมการเก็บและใช้ข้อมูลส่วนบุคคล (PDPA)
                </h3>
                <p className="text-[11px] text-gray-500">
                  มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border text-xs text-gray-600 space-y-3 overflow-y-auto max-h-60 leading-relaxed text-justify">
              <p className="font-semibold text-gray-800">
                เรียน เจ้าหน้าที่ผู้บันทึกข้อมูลแทนนักศึกษา
              </p>
              <p>
                การบันทึกข้อมูลคำขอทุนการศึกษาแทนนักศึกษา จำเป็นต้องได้รับความยินยอมจากเจ้าของข้อมูล (นักศึกษา) ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA):
              </p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  <b>การเก็บรวบรวม:</b> ข้อมูลส่วนบุคคลจะถูกใช้เพื่อการพิจารณาอนุมัติทุนการศึกษาเท่านั้น
                </li>
                <li>
                  <b>ความถูกต้องของข้อมูล:</b> เจ้าหน้าที่รับรองว่าได้รับอนุญาตและข้อมูลถูกต้องตามความเป็นจริง
                </li>
              </ol>
            </div>

            <div className="mt-4 pt-3 border-t">
              <div className="flex items-start space-x-2.5 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                <input
                  type="checkbox"
                  id="adminPdpaCheck"
                  checked={newRequest.pdpaConsent}
                  onChange={(e) => setNewRequest({ ...newRequest, pdpaConsent: e.target.checked })}
                  className="mt-0.5 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="adminPdpaCheck"
                  className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed"
                >
                  ข้าพเจ้าในฐานะเจ้าหน้าที่ผู้บันทึกข้อมูล ยืนยันว่านักศึกษาได้รับทราบและยินยอมตามนโยบาย PDPA เรียบร้อยแล้ว <span className="text-rose-500">*</span>
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowPdpaModalForAdmin(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
              >
                ย้อนกลับไปแก้ไข
              </button>
              <button
                type="button"
                disabled={!newRequest.pdpaConsent}
                onClick={async () => {
                  setShowPdpaModalForAdmin(false);
                  await handleCreateSubmitDirect();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                ยืนยันและบันทึกคำขอ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}