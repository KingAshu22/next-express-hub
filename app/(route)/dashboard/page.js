"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AWBTable from "@/app/_components/AWBTable";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format } from "date-fns";

const COLORS = ["#E31E24", "#34D399", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#10B981", "#F43F5E"];

function Dashboard() {
  const [awbData, setAWBData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState({
    name: "",
    code: "",
    userType: "",
  });

  const [rangeDays, setRangeDays] = useState(90);
  const [clientCount, setClientCount] = useState(null); // admin only (optional)
  const [franchiseCount, setFranchiseCount] = useState(null); // admin only (optional)

  useEffect(() => {
    // Read localStorage in effect to avoid hydration mismatch
    const name = localStorage.getItem("name") || "";
    const code = localStorage.getItem("code") || "";
    const userType = localStorage.getItem("userType") || "";
    setUser({ name, code, userType });
  }, []);

  useEffect(() => {
    fetchAWBData();
    // Optional counts if admin (only show if your API supports)
    fetchOptionalCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAWBData = async () => {
    try {
      setIsLoading(true);
      const userType = localStorage.getItem("userType");
      const userId = localStorage.getItem("code");

      const response = await axios.get("/api/awb", {
        headers: { userType, userId },
      });
      setAWBData(response.data || []);
    } catch (error) {
      console.error("Error fetching AWB data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional counts for admin tiles (safe fallback if endpoint not present)
  const fetchOptionalCounts = async () => {
    try {
      const userType = localStorage.getItem("userType");
      const userId = localStorage.getItem("code");
      if (userType !== "admin") return;

      // Use your real endpoints if different, or remove this section
      const [clientsRes, franchiseRes] = await Promise.allSettled([
        axios.get("/api/clients/count", { headers: { userType, userId } }),
        axios.get("/api/franchise/count", { headers: { userType, userId } }),
      ]);

      if (clientsRes.status === "fulfilled") setClientCount(clientsRes.value?.data?.count ?? null);
      if (franchiseRes.status === "fulfilled") setFranchiseCount(franchiseRes.value?.data?.count ?? null);
    } catch (e) {
      // ignore if not available
    }
  };

  const handleEditAWB = async (updatedAWB) => {
    try {
      await axios.put(`/api/awb/${updatedAWB.trackingNumber}`, updatedAWB);
      fetchAWBData();
    } catch (error) {
      console.error("Error updating AWB:", error);
    }
  };

  const handleDeleteAWB = async (trackingNumber) => {
    try {
      await axios.delete(`/api/awb/${trackingNumber}`);
      fetchAWBData();
    } catch (error) {
      console.error("Error deleting AWB:", error);
    }
  };

  // Helpers
  const parseAmount = (v) => {
    if (v == null) return 0;
    const n = parseFloat(String(v).toString().replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const parseWeight = (v) => {
    if (v == null) return 0;
    const n = parseFloat(String(v).toString().replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const latestStatusEntry = (awb) => {
    const list = (awb?.parcelStatus || [])
      .map((s) => ({
        ...s,
        timestamp: s?.timestamp ? new Date(s.timestamp) : null,
      }))
      .filter((s) => s.timestamp);
    if (!list.length) return null;
    list.sort((a, b) => a.timestamp - b.timestamp);
    return list[list.length - 1];
  };
  const statusKey = (s) => String(s || "").toLowerCase().trim();

  const niceCurrency = (amt, currency = "INR") => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amt);
    } catch {
      return `₹${Math.round(amt).toLocaleString("en-IN")}`;
    }
  };

  // Compute all analytics client-side from awbData
  const analytics = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);

    const inRange = (awb) => {
      const d = awb?.date ? new Date(awb.date) : null;
      const firstStatus = awb?.parcelStatus?.[0]?.timestamp ? new Date(awb.parcelStatus[0].timestamp) : null;
      const t = d || firstStatus || null;
      return t ? t >= cutoff : true;
    };

    const awbs = (awbData || []).filter(inRange);

    // Status counts
    const statusCounts = {};
    let totalRevenue = 0;
    let totalWeight = 0;
    let weightCount = 0;

    const deliveredKeywords = ["delivered"];
    const pendingKeywords = ["created", "booked", "ready for pickup", "pickup pending"];
    const cancelledKeywords = ["cancelled", "canceled"];
    const rtoKeywords = ["rto", "return"];

    const hasAnyKeyword = (s, arr) => arr.some((k) => s.includes(k));

    for (const a of awbs) {
      const latest = latestStatusEntry(a);
      const skey = statusKey(latest?.status || "unknown");
      statusCounts[skey] = (statusCounts[skey] || 0) + 1;

      totalRevenue += parseAmount(a?.rateInfo?.totalWithGST);
      const w = parseWeight(a?.rateInfo?.weight);
      if (w > 0) {
        totalWeight += w;
        weightCount++;
      }
    }

    const deliveredCount = Object.entries(statusCounts).reduce((acc, [k, v]) => (k.includes("delivered") ? acc + v : acc), 0);
    const totalForwarding = awbs.filter((awb) => !awb.forwardingNumber || awb.forwardingNumber.trim() === "").length;
    const totalBoxes = awbs.reduce((sum, awb) => sum + (awb.boxes?.length || 0), 0);
    const uniqueCountries = [...new Set(awbs.map((awb) => awb.receiver?.country).filter(Boolean))]
    const cancelledCount = Object.entries(statusCounts).reduce((acc, [k, v]) => (hasAnyKeyword(k, cancelledKeywords) ? acc + v : acc), 0);
    const pendingCount = Object.entries(statusCounts).reduce((acc, [k, v]) => (hasAnyKeyword(k, pendingKeywords) ? acc + v : acc), 0);
    const rtoCount = Object.entries(statusCounts).reduce((acc, [k, v]) => (hasAnyKeyword(k, rtoKeywords) ? acc + v : acc), 0);
    const inTransitCount =
      awbs.length - deliveredCount - cancelledCount - rtoCount - pendingCount >= 0
        ? awbs.length - deliveredCount - cancelledCount - rtoCount - pendingCount
        : 0;

    const avgWeight = weightCount ? totalWeight / weightCount : 0;

    // Time-series (last 12 months, or within range)
    const now = new Date();
    const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = (d) => format(d, "MMM yy");

    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: monthLabel(d) });
    }

    const byMonth = {};
    for (const m of months) {
      byMonth[m.key] = { shipments: 0, revenue: 0 };
    }
    for (const a of awbs) {
      const d = a?.date ? new Date(a.date) : null;
      if (!d) continue;
      const k = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      if (byMonth[k]) {
        byMonth[k].shipments += 1;
        byMonth[k].revenue += parseAmount(a?.rateInfo?.totalWithGST);
      }
    }
    const timeSeries = months.map((m) => ({
      month: m.label,
      shipments: byMonth[m.key]?.shipments || 0,
      revenue: byMonth[m.key]?.revenue || 0,
    }));

    // Pie data for status
    const pieData = [];
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .forEach(([k, v]) => pieData.push({ name: k.toUpperCase(), value: v }));

    // Top destinations (receiver.country -> fallback to zone)
    const destCounts = {};
    for (const a of awbs) {
      const country = a?.receiver?.country || a?.zone || a?.rateInfo?.zone || "Unknown";
      destCounts[country] = (destCounts[country] || 0) + 1;
    }
    const topDest = Object.entries(destCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Recent activity
    const recent = awbData
      .map((a) => {
        const l = latestStatusEntry(a);
        return l
          ? {
            awbNumber: a?.awbNumber || a?.trackingNumber || a?.invoiceNumber || "AWB",
            status: l?.status || "Updated",
            at: l?.timestamp,
          }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.at - a.at)
      .slice(0, 6);

    return {
      total: awbs.length,
      deliveredCount,
      totalForwarding,
      totalBoxes,
      uniqueCountries: uniqueCountries.length,
      inTransitCount,
      pendingCount,
      cancelledCount,
      rtoCount,
      totalRevenue,
      avgWeight,
      timeSeries,
      pieData,
      topDest,
      recent,
    };
  }, [awbData, rangeDays]);

  const currency = (awbData?.[0]?.shippingCurrency || "INR").toUpperCase();

  // Animations
  const fadeUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
  };

  return (
  <div className="container mx-auto px-4 py-8">
    <motion.div {...fadeUp} className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, <span className="text-[#E31E24]">{user.name || "User"}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Dashboard overview for {user.userType ? user.userType.toUpperCase() : "USER"}
        </p>
      </div>
    </motion.div>

    {(user.userType === "admin" || user.userType === "branch" || user.userType === "franchise") && (
      <>
        {/* KPI Cards */}
        <motion.div
          {...fadeUp}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${(user.userType === "admin" || user.userType === "branch")
            ? "xl:grid-cols-6"
            : "xl:grid-cols-4"
            } gap-4 mb-8`}
        >
          <KPI
            title="Total Shipments"
            value={analytics.total}
            accent="from-rose-500 to-pink-500"
          />

          {(user.userType === "admin" || user.userType === "branch") && (
            <KPI
              title="Forwarding Pending"
              value={analytics.totalForwarding}
              accent="from-yellow-500 to-amber-500"
            />
          )}

          <KPI
            title="Total Boxes"
            value={analytics.totalBoxes}
            accent="from-orange-500 to-red-500"
          />

          <KPI
            title="Top Destination"
            value={analytics.topDest?.[0]?.country || "—"}
            accent="from-blue-500 to-indigo-500"
          />

          {(user.userType === "admin" || user.userType === "branch") && (
            <KPI
              title="Revenue"
              value={niceCurrency(analytics.totalRevenue, currency)}
              accent="from-fuchsia-500 to-purple-500"
            />
          )}

          <KPI
            title="Countries Served"
            value={analytics.uniqueCountries}
            accent="from-green-500 to-emerald-600"
          />
        </motion.div>

        {/* Optional admin tiles */}
        {user.userType === "admin" && (clientCount !== null || franchiseCount !== null) && (
          <motion.div {...fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {clientCount !== null && (
              <KPI title="Total Clients" value={clientCount} accent="from-indigo-500 to-blue-600" />
            )}
            {franchiseCount !== null && (
              <KPI title="Total Branches/Franchises" value={franchiseCount} accent="from-teal-500 to-emerald-600" />
            )}
          </motion.div>
        )}

        {/* Charts */}
        <motion.div {...fadeUp} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 xl:col-span-2">
            <CardHeader>
              <CardTitle>Shipments & Revenue (Monthly)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries}>
                  <defs>
                    <linearGradient id="colorShip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E31E24" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#E31E24" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip formatter={(v, n) => (n === "revenue" ? niceCurrency(v, currency) : v)} />
                  <Area yAxisId="left" type="monotone" dataKey="shipments" stroke="#E31E24" fillOpacity={1} fill="url(#colorShip)" />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRev)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {analytics.pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topDest}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                {(analytics.recent || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b pb-3">
                    <div>
                      <p className="text-sm font-medium">{item.awbNumber}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                    <span className="text-xs text-gray-500">{format(item.at, "dd MMM, HH:mm")}</span>
                  </div>
                ))}
                {!analytics.recent?.length && (
                  <p className="text-sm text-muted-foreground">No recent updates</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick actions */}
        <motion.div {...fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <ActionCard title="Get Rates" onClick={() => (window.location.href = "/get-rates")} />
          <ActionCard title="PDF Rate" onClick={() => (window.location.href = "/pdf-rate")} />
          <ActionCard title="New Booking" onClick={() => (window.location.href = "/awb/create")} />
          <ActionCard title="All AWBs" onClick={() => (window.location.href = "/awb")} />
        </motion.div>
      </>
    )}
  </div>
);
}

// KPI Card
function KPI({ title, value, accent = "from-slate-500 to-gray-600" }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${accent}`} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Action card
function ActionCard({ title, onClick }) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow active:scale-[0.99]"
    >
      <CardContent className="py-6 text-center font-semibold">{title}</CardContent>
    </Card>
  );
}

export default withAuth(Dashboard);