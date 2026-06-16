import { useModule, Module } from '../context/ModuleContext';
import { Hotel, Users, DollarSign, FileText } from 'lucide-react';

const TABS: { id: Module; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'hotel', label: 'Hotel Analytics', icon: Hotel },
  { id: 'attendance', label: 'Attendance', icon: Users },
  { id: 'salary', label: 'Salary', icon: DollarSign },
  { id: 'salary-slip', label: 'Salary Slips', icon: FileText },
];

export function ModuleNav() {
  const { activeModule, setActiveModule } = useModule();
  return (
    <div className="w-full border-b border-border bg-background/60 backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-150 ${
                activeModule === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={1.75} />
              {tab.label}
              {tab.badge && (
                <span className="px-1.5 py-0.5 bg-primary/15 text-primary rounded-full text-[10px] font-semibold">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
