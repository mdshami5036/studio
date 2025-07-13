import { Suspense } from 'react';
import TourChat from '@/components/qreator/tour-chat';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
    return (
        <div className="flex flex-col h-[80vh] w-full max-w-2xl mx-auto p-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
             <div className="flex items-center space-x-4 mt-4 justify-end">
                <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-[250px] ml-auto" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
            </div>
        </div>
    )
}

export default function TourPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Suspense fallback={<LoadingSkeleton />}>
        <TourChat />
      </Suspense>
    </main>
  );
}
