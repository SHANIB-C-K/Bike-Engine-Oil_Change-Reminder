"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { Loader2, TrendingUp, IndianRupee, MapPin, Download, Image as ImageIcon, FileText, FileSpreadsheet } from "lucide-react";
import { format, subDays, isSameDay, startOfMonth, startOfDay } from "date-fns";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [rides, setRides] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7");
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch Rides
        const qRides = query(
          collection(db, "rides"),
          where("userId", "==", user.uid)
        );
        const rideSnaps = await getDocs(qRides);
        const rData = rideSnaps.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date()
        }));
        setRides(rData);

        // Fetch Expenses
        const qExp = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid)
        );
        const expSnaps = await getDocs(qExp);
        const eData = expSnaps.docs.map(d => ({
          id: d.id,
          ...d.data(),
          dateObj: d.data().date?.toDate() || new Date()
        }));
        setExpenses(eData);

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Process data for charts based on timeRange
  let chartData = [];
  let totalKmFiltered = 0;
  let totalExpenseFiltered = 0;

  if (timeRange === "all") {
    const grouped = {};
    [...rides, ...expenses].forEach(item => {
       const key = format(item.dateObj, 'MMM yyyy');
       const timestamp = startOfMonth(item.dateObj).getTime();
       if (!grouped[key]) grouped[key] = { date: key, timestamp, km: 0, expense: 0 };
    });

    rides.forEach(r => {
       grouped[format(r.dateObj, 'MMM yyyy')].km += r.km;
       totalKmFiltered += r.km;
    });
    expenses.forEach(e => {
       grouped[format(e.dateObj, 'MMM yyyy')].expense += e.amount;
       totalExpenseFiltered += e.amount;
    });

    chartData = Object.values(grouped).sort((a,b) => a.timestamp - b.timestamp);
  } else {
    const days = parseInt(timeRange);
    chartData = Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), (days - 1) - i);
      return {
        date: format(d, 'MMM dd'),
        rawDate: d,
        km: 0,
        expense: 0
      };
    });

    rides.forEach(r => {
      const t = chartData.find(d => isSameDay(d.rawDate, r.dateObj));
      if (t) {
         t.km += r.km;
         totalKmFiltered += r.km;
      }
    });

    expenses.forEach(e => {
      const t = chartData.find(d => isSameDay(d.rawDate, e.dateObj));
      if (t) {
         t.expense += e.amount;
         totalExpenseFiltered += e.amount;
      }
    });
  }

  const handleDownloadCsv = () => {
    let csv = "Date,Type,Value(KM/Rupees),Category\n";
    
    let filteredRides = rides;
    let filteredExpenses = expenses;

    if (timeRange !== "all") {
       const days = parseInt(timeRange);
       const cutoff = startOfDay(subDays(new Date(), days - 1));
       filteredRides = rides.filter(r => r.dateObj >= cutoff);
       filteredExpenses = expenses.filter(e => e.dateObj >= cutoff);
    }

    const allData = [
       ...filteredRides.map(r => ({ date: r.dateObj, type: 'Ride', value: r.km, category: '' })),
       ...filteredExpenses.map(e => ({ date: e.dateObj, type: 'Expense', value: e.amount, category: e.category || 'Maintenance' }))
    ].sort((a,b) => b.date - a.date);

    allData.forEach(item => {
       csv += `"${format(item.date, 'yyyy-MM-dd')}","${item.type}","${item.value}","${item.category}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bike_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadImage = async () => {
    if (!dashboardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
         quality: 0.95,
         backgroundColor: '#0f172a',
         pixelRatio: 2 // ensures high resolution
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `bike_analytics_${format(new Date(), 'yyyy-MM-dd')}.png`;
      a.click();
    } catch(err) {
      console.error('Error generating image', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!dashboardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(dashboardRef.current, {
         quality: 0.95,
         backgroundColor: '#0f172a',
         pixelRatio: 2
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm padding on each side
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.setTextColor(255, 255, 255);
      // We will place a background on the PDF itself to match
      pdf.setFillColor(15, 23, 42); 
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');

      pdf.setTextColor(200, 200, 200);
      pdf.setFontSize(14);
      pdf.text("BikeCare Analytics Report", 10, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Rides & Expenses Snapshot · Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 10, 22);
      
      pdf.addImage(dataUrl, 'PNG', 10, 30, pdfWidth, pdfHeight);
      pdf.save(`bike_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch(err) {
      console.error('Error generating pdf', err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-cyan-400" /> Analytics Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Visualize your rides and maintenance costs.
              </p>
              
              <div className="flex bg-slate-800 rounded-lg p-1 mt-4 w-fit border border-white/10">
                 {['7', '30', 'all'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTimeRange(t)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === t ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      {t === 'all' ? 'All Time' : `${t} Days`}
                    </button>
                 ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadCsv}
                title="Download CSV"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white transition-colors"
              >
                <FileSpreadsheet size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadImage}
                title="Download Image"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white transition-colors"
              >
                <ImageIcon size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadPdf}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-white text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <FileText size={16} /> Export PDF
              </motion.button>
            </div>
          </motion.div>

          <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-1 rounded-2xl">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="glass rounded-2xl p-6 border border-white/10"
             >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <MapPin className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{timeRange === 'all' ? 'Total Distance' : `${timeRange}-Day Distance`}</p>
                    <p className="text-3xl font-bold text-white">{totalKmFiltered.toFixed(1)} <span className="text-lg text-slate-500">km</span></p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}
                         itemStyle={{ color: '#a855f7' }}
                      />
                      <Area type="monotone" dataKey="km" stroke="#a855f7" fillOpacity={1} fill="url(#colorKm)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="glass rounded-2xl p-6 border border-white/10"
             >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <IndianRupee className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Expenses</p>
                    <p className="text-3xl font-bold text-white">₹{totalExpenseFiltered.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' }}
                         itemStyle={{ color: '#10b981' }}
                         cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      />
                      <Bar dataKey="expense" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
