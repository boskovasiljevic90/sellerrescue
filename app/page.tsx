import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">SellerRescueHub</h1>
        <p className="text-lg mb-6">
          Instantly recover your suspended Amazon seller account with the power of AI.
        </p>
        <Link
          href="/chat/agent"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Launch AI Agent
        </Link>
        <p className="text-sm mt-4 text-gray-500">Multilingual AI agent, 100% automated, available 24/7.</p>
      </div>
    </main>
  );
}
