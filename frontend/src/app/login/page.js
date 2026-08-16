'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `เข้าสู่ระบบไม่สำเร็จ (${res.status})`);
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.user?.username || username);
        window.location.href = '/admin/dashboard';
      } else {
        throw new Error('ไม่พบข้อมูล Token จากเซิร์ฟเวอร์');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4 flex flex-col items-center justify-center font-sans antialiased">
      {/* Header Badge */}
      <div className="max-w-md w-full text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-3 shadow-sm">
          <span>🔐</span>
          <span>เจ้าหน้าที่รับทุน / Admin Access</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          เข้าสู่ระบบจัดการทุน
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          งานสวัสดิการและทุนการศึกษา กองพัฒนานักศึกษาและศิษย์เก่าสัมพันธ์
        </p>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              รหัสผ่าน (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-blue-600 transition font-medium inline-flex items-center space-x-1"
          >
            <span>←หน้ายื่นคำขอทุนสำหรับนักศึกษา</span>
          </Link>
        </div>
      </div>
    </div>
  );
}