import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Star, Clock, Award } from 'lucide-react';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const MONTH_ORDER = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function Insights() {
  const { filteredData } = useData();

  const insights = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Top 5 months by revenue
    const monthRevMap: Record<string, { label: string; revenue: number; bookings: number }> = {};
    filteredData.forEach(row => {
      const d = row.booking_date instanceof Date ? row.booking_date : new Date(row.booking_date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTH_ORDER[d.getMonth()]} ${d.getFullYear()}`;
      if (!monthRevMap[key]) monthRevMap[key] = { label, revenue: 0, bookings: 0 };
      monthRevMap[key].revenue += row.total_bill || 0;
      monthRevMap[key].bookings += 1;
    });
    const topMonths = Object.values(monthRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Booking source effectiveness
    const sourceMap: Record<string, { bookings: number; revenue: number; totalRating: number; ratingCount: number }> = {};
    filteredData.forEach(row => {
      const s = row.booking_source || 'Unknown';
      if (!sourceMap[s]) sourceMap[s] = { bookings: 0, revenue: 0, totalRating: 0, ratingCount: 0 };
      sourceMap[s].bookings += 1;
      sourceMap[s].revenue += row.total_bill || 0;
      if (row.guest_rating > 0) { sourceMap[s].totalRating += row.guest_rating; sourceMap[s].ratingCount += 1; }
    });
    const sourceStats = Object.entries(sourceMap).map(([name, v]) => ({
      name,
      bookings: v.bookings,
      avgRevenue: v.revenue / v.bookings,
      avgRating: v.ratingCount > 0 ? v.totalRating / v.ratingCount : 0,
    })).sort((a, b) => b.avgRevenue - a.avgRevenue);

    // Guest satisfaction by guest type
    const typeRatingMap: Record<string, { total: number; count: number }> = {};
    filteredData.forEach(row => {
      const t = row.guest_type || 'Unknown';
      if (!typeRatingMap[t]) typeRatingMap[t] = { total: 0, count: 0 };
      if (row.guest_rating > 0) { typeRatingMap[t].total += row.guest_rating; typeRatingMap[t].count += 1; }
    });
    const guestSatisfaction = Object.entries(typeRatingMap).map(([type, v]) => ({
      type,
      avgRating: v.count > 0 ? v.total / v.count : 0,
      count: v.count,
    })).sort((a, b) => b.avgRating - a.avgRating);

    // Cancellation analysis
    const total = filteredData.length;
    const cancelled = filteredData.filter(r => r.booking_status?.toLowerCase() === 'cancelled').length;
    const noShow = filteredData.filter(r => r.booking_status?.toLowerCase() === 'no-show').length;
    const cancellationRate = (cancelled / total) * 100;
    const noShowRate = (noShow / total) * 100;

    // Avg stay by guest type
    const stayMap: Record<string, { total: number; count: number }> = {};
    filteredData.forEach(row => {
      const t = row.guest_type || 'Unknown';
      if (!stayMap[t]) stayMap[t] = { total: 0, count: 0 };
      stayMap[t].total += row.nights_stayed || 0;
      stayMap[t].count += 1;
    });
    const avgStayByType = Object.entries(stayMap).map(([type, v]) => ({
      type,
      avgStay: v.count > 0 ? v.total / v.count : 0,
    })).sort((a, b) => b.avgStay - a.avgStay);

    return { topMonths, sourceStats, guestSatisfaction, cancellationRate, noShowRate, cancelled, noShow, total, avgStayByType };
  }, [filteredData]);

  if (!insights) return null;

  const maxMonthRev = Math.max(...insights.topMonths.map(m => m.revenue), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground tracking-tight">Advanced Insights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Top 5 Months by Revenue */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Months by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topMonths.map((m, i) => (
              <div key={m.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="font-medium text-foreground">{m.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{formatCurrency(m.revenue)}</div>
                    <div className="text-muted-foreground">{m.bookings} bookings</div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(m.revenue / maxMonthRev) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Booking Source Effectiveness */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" /> Source Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.sourceStats.slice(0, 5).map(s => (
                <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.bookings} bookings</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">{formatCurrency(s.avgRevenue)}</div>
                    <div className="text-xs text-amber-500 flex items-center gap-0.5 justify-end">
                      <Star className="w-3 h-3 fill-amber-500" /> {s.avgRating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Guest Satisfaction */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Satisfaction by Guest Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.guestSatisfaction.map(g => (
                <div key={g.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{g.type}</span>
                    <span className="font-semibold text-amber-500">{g.avgRating.toFixed(2)} / 5.0</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(g.avgRating / 5) * 100}%` }} />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{g.count} reviews</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Analysis */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" /> Cancellation Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                <div className="text-2xl font-bold text-rose-500">{insights.cancellationRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-1">Cancellation Rate</div>
                <div className="text-xs font-medium text-rose-500 mt-0.5">{insights.cancelled} bookings</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-2xl font-bold text-amber-500">{insights.noShowRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground mt-1">No-Show Rate</div>
                <div className="text-xs font-medium text-amber-500 mt-0.5">{insights.noShow} bookings</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Successful bookings</span>
                <span className="font-medium text-emerald-500">
                  {(insights.total - insights.cancelled - insights.noShow).toLocaleString()} ({((insights.total - insights.cancelled - insights.noShow) / insights.total * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${((insights.total - insights.cancelled - insights.noShow) / insights.total) * 100}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${(insights.cancelled / insights.total) * 100}%` }} />
                <div className="h-full bg-amber-500 rounded-r-full" style={{ width: `${(insights.noShow / insights.total) * 100}%` }} />
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Success</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Cancelled</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />No-show</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Stay Duration by Guest Type */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Avg Stay Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.avgStayByType.map(g => (
                <div key={g.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{g.type}</span>
                    <span className="font-semibold text-sky-400">{g.avgStay.toFixed(1)} nights</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full"
                      style={{ width: `${Math.min(100, (g.avgStay / 14) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-primary" /> Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const totalBill = filteredData.reduce((s, r) => s + (r.total_bill || 0), 0);
              const roomRev = filteredData.reduce((s, r) => s + (r.room_revenue || 0), 0);
              const foodRev = filteredData.reduce((s, r) => s + (r.food_revenue || 0), 0);
              const roomPct = totalBill > 0 ? (roomRev / totalBill) * 100 : 0;
              const foodPct = totalBill > 0 ? (foodRev / totalBill) * 100 : 0;
              return (
                <>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Room Revenue</span>
                      <span className="font-semibold">{formatCurrency(roomRev)} <span className="text-muted-foreground font-normal">({roomPct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${roomPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Food & Beverage</span>
                      <span className="font-semibold">{formatCurrency(foodRev)} <span className="text-muted-foreground font-normal">({foodPct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full" style={{ width: `${foodPct}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Total Revenue</span>
                      <span className="font-bold text-foreground">{formatCurrency(totalBill)}</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
