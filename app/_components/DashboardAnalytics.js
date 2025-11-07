// components/dashboard/DashboardCharts.js

"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";

// Register the components you will use from Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function DashboardCharts({ analytics, isLoading }) {
  if (isLoading) {
    return null;
  }

  // Chart data and options
  const lineChartData = {
    labels: analytics.timeSeries.labels,
    datasets: [
      {
        label: "Shipments",
        data: analytics.timeSeries.data,
        borderColor: "rgb(220, 38, 38)",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#e5e7eb" }, ticks: { precision: 0 } },
    },
  };

  const doughnutChartData = {
    labels: analytics.pieData.labels,
    datasets: [
      {
        label: "Status",
        data: analytics.pieData.data,
        backgroundColor: [
          'rgba(22, 163, 74, 0.7)', // Delivered (Green)
          'rgba(234, 179, 8, 0.7)',  // In Transit (Yellow)
          'rgba(59, 130, 246, 0.7)', // Pending (Blue)
          'rgba(239, 68, 68, 0.7)',  // Issues (Red)
        ],
        borderColor: [
          'rgb(22, 163, 74)',
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <motion.div variants={itemVariants} className="lg:col-span-3">
        <ChartCard title="Shipments Over Time">
          <div className="h-[350px]">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </ChartCard>
      </motion.div>
      <motion.div variants={itemVariants} className="lg:col-span-2">
        <ChartCard title="Shipment Status">
          <div className="h-[350px] flex justify-center">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </ChartCard>
      </motion.div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
    return (
        <Card className="dark:bg-slate-900">
            <CardHeader><CardTitle className="text-base font-semibold">{title}</CardTitle></CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}