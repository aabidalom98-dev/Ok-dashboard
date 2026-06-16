import { useData } from '../context/DataContext';
import { KPICards } from './KPICards';
import { FiltersBar } from './FiltersBar';
import { Charts } from './Charts';
import { Insights } from './Insights';
import { DataTable } from './DataTable';
import { Footer } from './Footer';

export function Dashboard() {
  const { filteredData } = useData();

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 space-y-8">
        <FiltersBar />
        <KPICards />
        {filteredData.length === 0 ? (
          <div className="py-20 text-center border rounded-lg bg-card">
            <h3 className="text-xl font-medium text-muted-foreground">No data matches the current filters</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filter criteria to see results.</p>
          </div>
        ) : (
          <>
            <Charts />
            <Insights />
            <DataTable />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
