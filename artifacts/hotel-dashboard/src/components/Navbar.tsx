import { useData } from '../context/DataContext';
import { useAttendance } from '../modules/attendance/AttendanceContext';
import { useSalary } from '../modules/salary/SalaryContext';
import { useModule } from '../context/ModuleContext';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Diamond, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { activeModule } = useModule();
  const { fileName: hotelFile, rawData: hotelData, clearData: clearHotel } = useData();
  const { fileName: attFile, rawData: attData, clearData: clearAtt, isLoaded: attLoaded } = useAttendance();
  const { fileName: salFile, rawData: salData, clearData: clearSal, isLoaded: salLoaded } = useSalary();
  const { theme, setTheme } = useTheme();

  const fileInfo = (): { name: string; count: number; clear: () => void } | null => {
    if (activeModule === 'hotel' && hotelFile) return { name: hotelFile, count: hotelData.length, clear: clearHotel };
    if (activeModule === 'attendance' && attLoaded) return { name: attFile, count: attData.length, clear: clearAtt };
    if ((activeModule === 'salary' || activeModule === 'salary-slip') && salLoaded) return { name: salFile, count: salData.length, clear: clearSal };
    return null;
  };

  const info = fileInfo();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Diamond className="w-5 h-5 text-primary fill-primary/20" />
          <span className="text-lg font-semibold tracking-tight">
            Hotel<span className="text-primary font-bold">IQ</span>
          </span>
        </div>

        <div className="flex flex-1 justify-center">
          {info && (
            <div className="hidden md:flex items-center space-x-3 bg-muted/50 px-4 py-1.5 rounded-full border border-border">
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{info.name}</span>
              <div className="w-px h-4 bg-border" />
              <Badge variant="secondary" className="font-mono text-xs">
                {info.count.toLocaleString()} records
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {info && (
            <Button variant="outline" size="sm" onClick={info.clear} className="text-muted-foreground hover:text-destructive text-xs h-8">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
