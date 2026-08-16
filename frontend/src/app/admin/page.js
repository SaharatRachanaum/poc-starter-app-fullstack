'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // ปรับเปลี่ยนจาก adminToken เป็น token ให้ตรงกับตอน Login
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}