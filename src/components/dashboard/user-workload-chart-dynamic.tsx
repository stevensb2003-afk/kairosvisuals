'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const UserWorkloadChartDynamic = dynamic(
    () => import('@/components/dashboard/user-workload-chart').then(mod => mod.UserWorkloadChart),
    {
      ssr: false,
      loading: () => (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Carga por Usuario</CardTitle>
            <CardDescription>Ocupación de los editores esta semana.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="h-[250px]">
              <Skeleton className="h-full w-full" />
            </div>
          </CardContent>
        </Card>
      ),
    }
  );

export default UserWorkloadChartDynamic;
