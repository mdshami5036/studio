import QrGenerator from '@/components/qreator/qr-generator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary mb-2">
            Qreator
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Create, customize, and share dynamic QR codes with an AI-powered tour guide.
          </p>
        </header>
        <QrGenerator />
      </div>
    </main>
  );
}
