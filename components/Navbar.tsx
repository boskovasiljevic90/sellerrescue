'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">
        SellerRescueHub
      </div>
      <div className="space-x-4">
        <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
        <Link href="/chat/agent" className="text-gray-700 hover:text-blue-600">AI Agent</Link>
        <Link href="/chat/upload" className="text-gray-700 hover:text-blue-600">Upload File</Link>
      </div>
    </nav>
  );
}
