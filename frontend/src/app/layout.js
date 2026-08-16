import './globals.css';

export const metadata = {
  title: 'ระบบบริหารจัดการคำขอทุนการศึกษา',
  description: 'ระบบยื่นและจัดการคำขอทุนการศึกษา',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}