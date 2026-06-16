import { useData } from '../context/DataContext';

export function Footer() {
  const { fileName, rawData } = useData();

  return (
    <footer className="border-t border-border mt-8 py-6 bg-background">
      <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">HotelIQ</span> Analytics Dashboard
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-4">
          <span>Dataset: {fileName}</span>
          <span>•</span>
          <span>{rawData.length.toLocaleString()} total records</span>
        </div>
      </div>
    </footer>
  );
}
