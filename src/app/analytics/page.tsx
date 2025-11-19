import { getAnalytics } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export default async function AnalyticsPage() {
    const data = await getAnalytics();

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Productivity Analytics 📊</h1>
                <p className="text-muted-foreground mt-2">
                    Understand your productivity patterns and optimize your workflow
                </p>
            </div>

            <AnalyticsCharts data={data} />
        </div>
    );
}
