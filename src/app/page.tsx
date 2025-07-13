import QrScanner from '@/components/qreator/qr-scanner';

export default function Home() {
  return (
    <main className="relative min-h-screen w-screen bg-black">
      <QrScanner />
    </main>
  );
}
