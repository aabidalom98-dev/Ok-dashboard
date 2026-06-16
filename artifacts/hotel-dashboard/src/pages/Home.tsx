import { useModule } from '../context/ModuleContext';
import { useData } from '../context/DataContext';
import { useAttendance } from '../modules/attendance/AttendanceContext';
import { useSalary } from '../modules/salary/SalaryContext';
import { Dashboard } from '../components/Dashboard';
import { FileUpload } from '../components/FileUpload';
import { ModuleNav } from '../components/ModuleNav';
import { ModuleUpload } from '../components/ModuleUpload';
import { AttendanceDashboard } from '../modules/attendance/AttendanceDashboard';
import { SalaryDashboard } from '../modules/salary/SalaryDashboard';
import { SalarySlipDashboard } from '../modules/salary-slip/SalarySlipDashboard';
import { Navbar } from '../components/Navbar';

const ATTENDANCE_COLUMNS = [
  'Employee_Name', 'Employee_ID', 'Department', 'Designation', 'Shift',
  'Month', 'Present_Days', 'Absent_Days', 'Half_Days', 'Overtime',
  'Late_Arrivals', 'Leave_Count', 'Total_Working_Days',
];

const SALARY_COLUMNS = [
  'Employee_Name', 'Employee_ID', 'Department', 'Designation',
  'Basic_Salary', 'Gross_Salary', 'Net_Salary', 'Bonus', 'Allowances',
  'Deductions', 'PF', 'ESI', 'Tax', 'Payment_Status', 'Payroll_Month',
];

export default function Home() {
  const { activeModule } = useModule();
  const { isLoaded: hotelLoaded } = useData();
  const { isLoaded: attendanceLoaded, loadData: loadAttendance } = useAttendance();
  const { isLoaded: salaryLoaded, loadData: loadSalary } = useSalary();

  const renderModule = () => {
    switch (activeModule) {
      case 'hotel':
        return !hotelLoaded ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <FileUpload />
          </div>
        ) : (
          <Dashboard />
        );

      case 'attendance':
        return !attendanceLoaded ? (
          <div className="flex flex-1 justify-center">
            <ModuleUpload
              moduleName="Attendance Analytics"
              description="Upload any attendance sheet — the AI parser auto-detects all column formats and layouts."
              sampleColumns={ATTENDANCE_COLUMNS}
              onData={loadAttendance}
            />
          </div>
        ) : (
          <AttendanceDashboard />
        );

      case 'salary':
        return !salaryLoaded ? (
          <div className="flex flex-1 justify-center">
            <ModuleUpload
              moduleName="Salary Analytics"
              description="Upload any payroll or salary sheet — works with any format, column naming, or layout."
              sampleColumns={SALARY_COLUMNS}
              onData={loadSalary}
            />
          </div>
        ) : (
          <SalaryDashboard />
        );

      case 'salary-slip':
        return <SalarySlipDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      <Navbar />
      <ModuleNav />
      <div className="flex flex-1 flex-col">
        {renderModule()}
      </div>
    </div>
  );
}
