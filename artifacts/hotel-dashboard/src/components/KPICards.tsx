import { useData } from '../context/DataContext';
import { DollarSign, CalendarCheck, Users, Star, Clock, TrendingUp, Utensils, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

function TrendArrow({ positive }: { positive: boolean }) {
  return (
    <span className={`flex items-center justify-center w-6 h-6 rounded-full ${positive ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
      <svg
        className={`w-3.5 h-3.5 ${positive ? 'text-emerald-500' : 'text-rose-500'}`}
        fill="none" viewBox="0 0 12 12"
      >
        {positive
          ? <path d="M2 9L6 3L10 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M2 3L6 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </span>
  );
}

export function KPICards() {
  const { filteredData, rawData } = useData();

  if (filteredData.length === 0) return null;

  const totalRevenue = filteredData.reduce((s, r) => s + r.total_bill, 0);
  const totalBookings = filteredData.length;
  const totalGuests = filteredData.reduce((s, r) => s + r.guest_count, 0);
  const avgRating = filteredData.reduce((s, r) => s + r.guest_rating, 0) / totalBookings;
  const avgStay = filteredData.reduce((s, r) => s + r.nights_stayed, 0) / totalBookings;
  const totalFoodRevenue = filteredData.reduce((s, r) => s + r.food_revenue, 0);
  const avgRevPerBooking = totalRevenue / totalBookings;
  const confirmed = filteredData.filter(r => ['confirmed', 'completed'].includes(r.booking_status.toLowerCase())).length;
  const occupancy = (confirmed / totalBookings) * 100;

  const kpis = [
    {
      label: 'TOTAL REVENUE',
      value: formatCurrency(totalRevenue),
      sub: 'All bookings',
      icon: DollarSign,
      positive: true,
    },
    {
      label: 'TOTAL BOOKINGS',
      value: totalBookings.toLocaleString(),
      sub: 'In current view',
      icon: CalendarCheck,
      positive: true,
    },
    {
      label: 'TOTAL GUESTS',
      value: totalGuests.toLocaleString(),
      sub: 'Total guests served',
      icon: Users,
      positive: true,
    },
    {
      label: 'AVG GUEST RATING',
      value: avgRating.toFixed(2),
      sub: 'Out of 5.0',
      icon: Star,
      positive: avgRating >= 4,
    },
    {
      label: 'AVG STAY',
      value: `${avgStay.toFixed(1)} nights`,
      sub: 'Per booking',
      icon: Clock,
      positive: true,
    },
    {
      label: 'OCCUPANCY',
      value: `${occupancy.toFixed(1)}%`,
      sub: 'Stayed vs total',
      icon: TrendingUp,
      positive: occupancy >= 80,
    },
    {
      label: 'FOOD REVENUE',
      value: formatCurrency(totalFoodRevenue),
      sub: 'F&B contribution',
      icon: Utensils,
      positive: true,
    },
    {
      label: 'AVG / BOOKING',
      value: formatCurrency(avgRevPerBooking),
      sub: 'ARPB',
      icon: BarChart2,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.04 }}
        >
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-border/80 transition-all duration-200 group">
            {/* Top row: icon + label + trend */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <kpi.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                  {kpi.label}
                </span>
              </div>
              <TrendArrow positive={kpi.positive} />
            </div>

            {/* Value */}
            <div className="text-[1.85rem] font-bold leading-none tracking-tight text-foreground mb-2">
              {kpi.value}
            </div>

            {/* Sub label */}
            <div className="text-xs text-muted-foreground">
              {kpi.sub}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
