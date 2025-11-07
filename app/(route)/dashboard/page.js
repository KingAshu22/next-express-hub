// app/(route)/dashboard/page.js

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import { Package, CheckCircle2, Ship, AlertCircle, Users, Building, FileText, PlusCircle, BookOpen, Loader2, DollarSign, Clock } from "lucide-react";

// Dynamically import the charts component to prevent SSR issues. This is correct.
const DashboardCharts = dynamic(
  () => import("@/app/_components/DashboardAnalytics"),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
);

// MAIN DASHBOARD COMPONENT
function Dashboard() {
  const [awbData, setAWBData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({ name: "", code: "", userType: "" });
  const [rangeDays, setRangeDays] = useState(30);
  const [clientCount, setClientCount] = useState(null);
  const [franchiseCount, setFranchiseCount] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setUser({
      name: localStorage.getItem("name") || "",
      code: localStorage.getItem("code") || "",
      userType: localStorage.getItem("userType") || "",
    });

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userType = localStorage.getItem("userType");
        const userId = localStorage.getItem("code");

        const response = await axios.get("/api/awb", { headers: { userType, userId } });
        setAWBData(response.data?.data || []);

        if (userType === "admin") {
          const [franchiseRes, clientRes] = await Promise.all([
            axios.get("/api/franchises").catch(() => ({ data: [] })),
            axios.get("/api/clients").catch(() => ({ data: [] })),
          ])
          setClientCount(clientRes.data.length ?? null);
          setFranchiseCount(franchiseRes.data.length ?? null);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setAWBData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const analytics = useMemo(() => {
    const cleanAwbData = (Array.isArray(awbData) ? awbData : []).filter(awb => awb && typeof awb === 'object');
    const cutoff = subDays(new Date(), rangeDays);
    const awbs = cleanAwbData.filter(awb => new Date(awb.date) >= cutoff);

    if (awbs.length === 0) {
      return { total: 0, delivered: 0, inTransit: 0, pending: 0, issues: 0, totalRevenue: 0, timeSeries: { labels: [], data: [] }, pieData: { labels: [], data: [] } };
    }

    let totalRevenue = 0;
    const statusGroups = { delivered: 0, inTransit: 0, pending: 0, issues: 0 };
    const byDay = {};

    // --- START: THE CRUCIAL FIX ---
    // This helper function now correctly handles the { "$date": "..." } structure from your MongoDB data.
    const latestStatusEntry = (awb) => {
      if (!awb.parcelStatus || awb.parcelStatus.length === 0) {
        return null;
      }
      return awb.parcelStatus
        .slice() // Create a shallow copy to avoid mutating original data
        .sort((a, b) => {
          // Check for the BSON date object format first, then fall back to a direct string.
          const dateA = new Date(a.timestamp?.$date || a.timestamp);
          const dateB = new Date(b.timestamp?.$date || b.timestamp);
          return dateB - dateA; // Sort descending to get the latest date first
        })[0];
    };
    // --- END: THE CRUCIAL FIX ---

    const deliveredKeywords = ['delivered'];
    const issuesKeywords = ['unsuccessful', 'rto', 'return', 'cancelled', 'canceled'];
    const pendingKeywords = ['prepared', 'scanned at origin'];

    for (const a of awbs) {
      totalRevenue += parseFloat(a.rateInfo?.totalWithGST || 0);
      const latestStatus = latestStatusEntry(a)?.status.toLowerCase() || 'pending';
      
      if (deliveredKeywords.some(k => latestStatus.includes(k))) {
        statusGroups.delivered++;
      } else if (issuesKeywords.some(k => latestStatus.includes(k))) {
        statusGroups.issues++;
      } else if (pendingKeywords.some(k => latestStatus.includes(k))) {
        statusGroups.pending++;
      } else {
        statusGroups.inTransit++;
      }

      if (a.date) {
        const dayKey = format(new Date(a.date), "yyyy-MM-dd");
        byDay[dayKey] = (byDay[dayKey] || 0) + 1;
      }
    }

    const timeSeriesLabels = Object.keys(byDay).sort();
    const timeSeries = {
      labels: timeSeriesLabels.map(day => format(new Date(day), 'd MMM')),
      data: timeSeriesLabels.map(day => byDay[day]),
    };

    const pieData = {
      labels: ['Delivered', 'In Transit', 'Pending', 'Issues'],
      data: [statusGroups.delivered, statusGroups.inTransit, statusGroups.pending, statusGroups.issues],
    };

    return {
      total: awbs.length,
      delivered: statusGroups.delivered,
      inTransit: statusGroups.inTransit,
      pending: statusGroups.pending,
      issues: statusGroups.issues,
      totalRevenue,
      timeSeries,
      pieData,
    };
  }, [awbData, rangeDays]);

  const niceCurrency = (amt) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amt);
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Welcome back, <span className="text-red-600">{user.name || "User"}</span></h1>
              <p className="text-sm text-muted-foreground">Here's your performance snapshot.</p>
            </div>
            <DateRangePicker selected={rangeDays} onSelect={setRangeDays} />
          </motion.div>
          
          <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <motion.div variants={itemVariants}><KPI title="Total Shipments" value={isLoading ? <Loader2 className="animate-spin" /> : analytics.total} icon={Package} color="text-blue-500" /></motion.div>
            <motion.div variants={itemVariants}><KPI title="Delivered" value={isLoading ? <Loader2 className="animate-spin" /> : analytics.delivered} icon={CheckCircle2} color="text-green-500" /></motion.div>
            <motion.div variants={itemVariants}><KPI title="In Transit" value={isLoading ? <Loader2 className="animate-spin" /> : analytics.inTransit} icon={Ship} color="text-orange-500" /></motion.div>
            <motion.div variants={itemVariants}><KPI title="Pending" value={isLoading ? <Loader2 className="animate-spin" /> : analytics.pending} icon={Clock} color="text-purple-500" /></motion.div>
            <motion.div variants={itemVariants}><KPI title="Issues / RTO" value={isLoading ? <Loader2 className="animate-spin" /> : analytics.issues} icon={AlertCircle} color="text-red-500" /></motion.div>
          </motion.div>
          
          {user.userType === 'admin' && (
            <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <motion.div variants={itemVariants}><KPI title="Total Revenue" value={isLoading ? <Loader2 className="animate-spin" /> : niceCurrency(analytics.totalRevenue)} icon={DollarSign} color="text-teal-500" /></motion.div>
              <motion.div variants={itemVariants}><KPI title="Total Clients" value={clientCount === null ? <Loader2 className="animate-spin" /> : clientCount} icon={Users} color="text-indigo-500" /></motion.div>
              <motion.div variants={itemVariants}><KPI title="Total Branches" value={franchiseCount === null ? <Loader2 className="animate-spin" /> : franchiseCount} icon={Building} color="text-fuchsia-500" /></motion.div>
            </motion.div>
          )}

          <DashboardCharts analytics={analytics} isLoading={isLoading} />

          <motion.h2 variants={itemVariants} className="text-xl font-semibold mb-4 mt-8">Quick Actions</motion.h2>
          <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div variants={itemVariants}><ActionCard title="New Booking" icon={PlusCircle} onClick={() => router.push("/awb/create")} /></motion.div>
            <motion.div variants={itemVariants}><ActionCard title="View All AWBs" icon={BookOpen} onClick={() => router.push("/awb")} /></motion.div>
            <motion.div variants={itemVariants}><ActionCard title="Get Rates" icon={DollarSign} onClick={() => router.push("/get-rates")} /></motion.div>
            <motion.div variants={itemVariants}><ActionCard title="PDF Rate" icon={FileText} onClick={() => router.push("/pdf-rate")} /></motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Reusable Sub-components (No changes needed here)
function KPI({ title, value, icon: Icon, color }) {
  return (
    <Card className="hover:shadow-lg transition-shadow dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />}
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function ActionCard({ title, icon: Icon, onClick }) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} className="h-full">
      <Card onClick={onClick} className="cursor-pointer h-full transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
        <CardContent className="py-6 flex flex-col items-center justify-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-red-600" />}
          <span className="text-center font-semibold text-sm">{title}</span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DateRangePicker({ selected, onSelect }) {
  return (
    <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
      {[7, 30, 90].map(day => (
        <Button key={day} size="sm" variant="ghost"
          className={`px-3 transition-all ${selected === day ? 'bg-white dark:bg-slate-900 shadow-sm text-primary font-semibold' : 'text-muted-foreground hover:text-primary'}`}
          onClick={() => onSelect(day)}
        >
          {day}D
        </Button>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default withAuth(Dashboard);