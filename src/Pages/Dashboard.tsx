import { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { ProgressSpinner } from 'primereact/progressspinner';
import StatCard from '../components/ui/StatCard';
import api from '@/api/api'; // Using your existing axios instance

interface DashboardData {
    totalClients: number;
    activeUsers: number;
    totalRevenue: number;
    pendingAmount: number;
    overdueCount: number;
    paidInvoices: number;
}

const Dashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Adjust this URL to match your Fiber/Gin router path
                const res = await api.get('/dashboard/summary'); 
                if (res.data.status) {
                    setData(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // 1. Loading State
    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="8" />
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Gathering Data...</p>
            </div>
        );
    }

    // 2. Chart Configuration (Static for now, or you can fetch this too)
    const chartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue',
            data: [40000, 45000, 55000, 50000, 75000, data?.totalRevenue || 0],
            fill: true,
            borderColor: '#2563eb', 
            tension: 0.4,
            backgroundColor: 'rgba(37, 99, 235, 0.1)'
        }]
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900">Dashboard</h1>
            </header>

            {/* Stats Grid - Mapping your Go Model fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Revenue" 
                    value={`₹${data?.totalRevenue.toLocaleString() || '0'}`} 
                    icon={<i className="pi pi-indian-rupee" style={{ fontSize: '1.2rem' }}></i>} 
                />
                <StatCard 
                    label="Active Clients" 
                    value={data?.totalClients || 0} 
                    icon={<i className="pi pi-users" style={{ fontSize: '1.2rem' }}></i>} 
                />
                <StatCard 
                    label="Pending Amount" 
                    value={`₹${data?.pendingAmount.toLocaleString() || '0'}`} 
                    icon={<i className="pi pi-clock" style={{ fontSize: '1.2rem' }}></i>} 
                />
                <StatCard 
                    label="Overdue Invoices" 
                    value={data?.overdueCount || 0} 
                    icon={<i className="pi pi-exclamation-circle" style={{ fontSize: '1.2rem' }}></i>} 
                />
                 <StatCard 
        label="Active Users" 
        value={data?.activeUsers || 0} 
        icon={<i className="pi pi-user" style={{ fontSize: '1.2rem' }}></i>} 
    />

    <StatCard 
        label="Paid Invoices" 
        value={data?.paidInvoices || 0} 
        icon={<i className="pi pi-check-circle" style={{ fontSize: '1.2rem' }}></i>} 
    />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[2.5rem]">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Revenue Growth</h3>
                    <div className="h-64">
                        <Chart type="line" data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;