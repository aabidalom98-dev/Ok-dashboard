import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface HotelBooking {
  booking_id: string;
  booking_date: Date;
  check_in_date: Date;
  check_out_date: Date;
  guest_age: number;
  guest_type: string;
  booking_source: string;
  nights_stayed: number;
  number_of_rooms: number;
  guest_count: number;
  room_price: number;
  room_revenue: number;
  food_revenue: number;
  total_bill: number;
  booking_status: string;
  guest_rating: number;
  guest_country: string;
  payment_method: string;
}

export interface Filters {
  dateRange: { start: Date | null; end: Date | null };
  bookingMonths: string[];
  guestTypes: string[];
  bookingSources: string[];
  guestCountries: string[];
  paymentMethods: string[];
  bookingStatuses: string[];
}

interface DataContextType {
  rawData: HotelBooking[];
  filteredData: HotelBooking[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  fileName: string;
  isLoaded: boolean;
  loadData: (data: any[], name: string) => void;
  clearData: () => void;
}

const defaultFilters: Filters = {
  dateRange: { start: null, end: null },
  bookingMonths: [],
  guestTypes: [],
  bookingSources: [],
  guestCountries: [],
  paymentMethods: [],
  bookingStatuses: [],
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<HotelBooking[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const isLoaded = rawData.length > 0;

  const loadData = (data: any[], name: string) => {
    // Build a case-insensitive, space/underscore-agnostic column lookup
    const normalize = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');

    const getCol = (row: any, ...keys: string[]): any => {
      const rowKeys = Object.keys(row);
      for (const key of keys) {
        const nk = normalize(key);
        const match = rowKeys.find(rk => normalize(rk) === nk);
        if (match !== undefined && row[match] !== undefined && row[match] !== '') {
          return row[match];
        }
      }
      return undefined;
    };

    // Parse numbers: strip currency symbols, commas, spaces; handle NaN
    const parseNum = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      const cleaned = String(val).replace(/[$,£€¥\s]/g, '').trim();
      const n = parseFloat(cleaned);
      return isNaN(n) ? 0 : n;
    };

    // Parse dates robustly
    const parseDate = (val: any): Date => {
      if (!val) return new Date();
      if (val instanceof Date) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const processedData: HotelBooking[] = data.map(row => {
      return {
        booking_id: String(getCol(row, 'Booking_ID', 'BookingID', 'booking_id') ?? ''),
        booking_date: parseDate(getCol(row, 'Booking_Date', 'booking_date')),
        check_in_date: parseDate(getCol(row, 'Check_In_Date', 'CheckInDate', 'check_in_date')),
        check_out_date: parseDate(getCol(row, 'Check_Out_Date', 'CheckOutDate', 'check_out_date')),
        guest_age: parseNum(getCol(row, 'Guest_Age', 'guest_age')),
        guest_type: String(getCol(row, 'Guest_Type', 'guest_type') ?? ''),
        booking_source: String(getCol(row, 'Booking_Source', 'booking_source') ?? ''),
        nights_stayed: parseNum(getCol(row, 'Nights_Stayed', 'nights_stayed', 'Nights')),
        number_of_rooms: parseNum(getCol(row, 'Number_of_Rooms', 'number_of_rooms', 'Rooms')),
        guest_count: (() => {
          const g = parseNum(getCol(row,
            'Total_Guests', 'total_guests', 'TotalGuests',
            'Number_of_Guests', 'number_of_guests', 'NumberOfGuests', 'No_of_Guests', 'NoOfGuests',
            'Guest_Count', 'guest_count', 'GuestCount',
            'Guests', 'Pax', 'PAX', 'guest_pax', 'Total_Pax',
          ));
          if (g > 0) return g;
          // Fallback: number of rooms × nights gives a proxy when no guest column exists
          return parseNum(getCol(row, 'Number_of_Rooms', 'number_of_rooms', 'Rooms'));
        })(),
        room_price: parseNum(getCol(row, 'Room_Price', 'room_price', 'RoomPrice')),
        room_revenue: parseNum(getCol(row, 'Room_Revenue', 'room_revenue', 'RoomRevenue')),
        food_revenue: parseNum(getCol(row, 'Food_Revenue', 'food_revenue', 'FoodRevenue')),
        total_bill: parseNum(getCol(row, 'Total_Bill', 'total_bill', 'TotalBill', 'Total Bill', 'Total_Revenue', 'total_revenue', 'TotalRevenue', 'Total Revenue', 'Total')),
        booking_status: String(getCol(row, 'Booking_Status', 'booking_status', 'Status') ?? ''),
        guest_rating: parseNum(getCol(row, 'Guest_Rating', 'guest_rating', 'Rating')),
        guest_country: String(getCol(row, 'Guest_Country', 'guest_country', 'Country') ?? ''),
        payment_method: String(getCol(row, 'Payment_Method', 'payment_method', 'Payment') ?? ''),
      };
    }).filter(row => row.booking_id); // Basic validation

    setRawData(processedData);
    setFileName(name);
    setFilters(defaultFilters);
  };

  const clearData = () => {
    setRawData([]);
    setFileName('');
    setFilters(defaultFilters);
  };

  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      // Match all active filters
      if (filters.dateRange.start && row.booking_date < filters.dateRange.start) return false;
      if (filters.dateRange.end && row.booking_date > filters.dateRange.end) return false;
      
      const month = row.booking_date.toLocaleString('default', { month: 'long' });
      if (filters.bookingMonths.length > 0 && !filters.bookingMonths.includes(month)) return false;
      
      if (filters.guestTypes.length > 0 && !filters.guestTypes.includes(row.guest_type)) return false;
      if (filters.bookingSources.length > 0 && !filters.bookingSources.includes(row.booking_source)) return false;
      if (filters.guestCountries.length > 0 && !filters.guestCountries.includes(row.guest_country)) return false;
      if (filters.paymentMethods.length > 0 && !filters.paymentMethods.includes(row.payment_method)) return false;
      if (filters.bookingStatuses.length > 0 && !filters.bookingStatuses.includes(row.booking_status)) return false;

      return true;
    });
  }, [rawData, filters]);

  const value = {
    rawData,
    filteredData,
    filters,
    setFilters,
    fileName,
    isLoaded,
    loadData,
    clearData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
