'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const UserWorkloadChartDynamic = dynamic(
    () => import('@/components/dashboard/user-workload-chart').then(mod => mod.UserWorkloadChart),
    {
      ssr: false,
      loading: () => (
        <Card>
          <CardHeader>
             <div className="flex justify-between items-start">
                <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-4 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </div>
             <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                </div>
            </div>
          </CardContent>
        </Card>
      ),
    }
  );

export default UserWorkloadChartDynamic;
