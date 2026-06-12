import { useState, useEffect, useCallback } from "react";
import { format, parse, subDays } from "date-fns";
import { attendanceService } from "@/lib/services";
import type { Attendance } from "@/lib/types/attendance.type";
import { toast } from "sonner";

interface UseAttendanceRecordsProps {
  selectedStaffId: string;
  dateStr: string;
  fetchRange30Days?: boolean;
}

export function useAttendanceRecords({
  selectedStaffId,
  dateStr,
  fetchRange30Days = false,
}: UseAttendanceRecordsProps) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      let data: Attendance[];

      if (selectedStaffId === "all") {
        if (fetchRange30Days) {
          const endDate = dateStr || format(new Date(), "yyyy-MM-dd");
          const parsedEndDate = parse(endDate, "yyyy-MM-dd", new Date());
          const startDate = format(subDays(parsedEndDate, 30), "yyyy-MM-dd");
          data = await attendanceService.getAll(startDate, endDate);
        } else {
          data = await attendanceService.getByDate(dateStr);
        }
      } else {
        const allData = await attendanceService.getByStaffId(selectedStaffId);
        if (fetchRange30Days) {
          data = allData;
        } else {
          data = allData.filter((record) => record.date === dateStr);
        }
      }

      setRecords(data);
    } catch (error) {
      console.error("Failed to load attendance records:", error);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [selectedStaffId, dateStr, fetchRange30Days]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return {
    records,
    loading,
    refetch: loadRecords,
  };
}
