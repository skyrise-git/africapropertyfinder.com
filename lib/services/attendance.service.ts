import { createClient } from "@/lib/supabase/client";
import type {
  Attendance,
  AttendanceInput,
  AttendanceLocation,
  AttendanceAnalytics,
  AdminAnalytics,
} from "@/lib/types/attendance.type";

class AttendanceService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get db(): any {
    return createClient();
  }

  async punchIn(data: AttendanceInput): Promise<string> {
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const today = new Date().toISOString().split("T")[0];

    if (!data.staffId || !data.staffName || !data.location) {
      throw new Error("Missing required fields for punch in");
    }

    if (
      typeof data.location.lat !== "number" ||
      typeof data.location.lng !== "number" ||
      !data.location.address
    ) {
      throw new Error("Invalid location data");
    }

    const { data: row, error } = await this.db
      .from("attendance")
      .insert({
        staffId: data.staffId,
        staffName: data.staffName,
        date: today,
        punchInTime: now,
        punchInLocation: data.location,
        status: "present",
        createdAt: nowISO,
        updatedAt: nowISO,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return row.id;
  }

  async punchOut(recordId: string, location: AttendanceLocation): Promise<void> {
    const record = await this.getById(recordId);
    if (!record) throw new Error("Attendance record not found");

    const punchOutTime = Date.now();
    const totalHours =
      Math.round(((punchOutTime - record.punchInTime) / (1000 * 60 * 60)) * 100) / 100;

    const { error } = await this.db
      .from("attendance")
      .update({
        punchOutTime,
        punchOutLocation: location,
        totalHours,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (error) throw new Error(error.message);
  }

  async getTodayPunchIn(staffId: string): Promise<Attendance | null> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await this.db
      .from("attendance")
      .select("*")
      .eq("staffId", staffId)
      .eq("date", today)
      .limit(1)
      .single();

    if (error) return null;
    return data as unknown as Attendance;
  }

  async getById(recordId: string): Promise<Attendance | null> {
    const { data, error } = await this.db
      .from("attendance")
      .select("*")
      .eq("id", recordId)
      .single();

    if (error) return null;
    return data as unknown as Attendance;
  }

  async getByStaffId(
    staffId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Attendance[]> {
    let query = this.db
      .from("attendance")
      .select("*")
      .eq("staffId", staffId);

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query.order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Attendance[];
  }

  async getByDate(date: string): Promise<Attendance[]> {
    const { data, error } = await this.db
      .from("attendance")
      .select("*")
      .eq("date", date)
      .order("punchInTime", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Attendance[];
  }

  async getAll(startDate?: string, endDate?: string): Promise<Attendance[]> {
    let query = this.db.from("attendance").select("*");

    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    const { data, error } = await query.order("date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Attendance[];
  }

  async getStaffAnalytics(
    staffId: string,
    period: "week" | "month"
  ): Promise<AttendanceAnalytics> {
    const now = new Date();
    const startDate = new Date();
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const records = await this.getByStaffId(staffId, startDateStr);

    const completedRecords = records.filter(
      (record) => record.punchOutTime && record.totalHours
    );
    const totalHours = completedRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );
    const presentDays = new Set(records.map((r) => r.date)).size;
    const totalDays = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const absentDays = totalDays - presentDays;
    const averageHoursPerDay =
      presentDays > 0 ? Math.round((totalHours / presentDays) * 100) / 100 : 0;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays,
      presentDays,
      absentDays,
      averageHoursPerDay,
    };
  }

  async getAdminAnalytics(period: "week" | "month"): Promise<AdminAnalytics> {
    const now = new Date();
    const startDate = new Date();
    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const records = await this.getAll(startDateStr);

    const today = now.toISOString().split("T")[0];
    const todayRecords = records.filter((record) => record.date === today);
    const uniqueStaffIds = new Set(records.map((r) => r.staffId));
    const presentStaffIds = new Set(
      todayRecords.filter((r) => r.status === "present").map((r) => r.staffId)
    );

    const completedRecords = records.filter(
      (record) => record.punchOutTime && record.totalHours
    );
    const totalHours = completedRecords.reduce(
      (sum, record) => sum + (record.totalHours || 0),
      0
    );

    const averageHoursPerStaff =
      uniqueStaffIds.size > 0
        ? Math.round((totalHours / uniqueStaffIds.size) * 100) / 100
        : 0;

    return {
      totalStaff: uniqueStaffIds.size,
      presentStaff: presentStaffIds.size,
      absentStaff: uniqueStaffIds.size - presentStaffIds.size,
      averageHoursPerStaff,
      totalHours: Math.round(totalHours * 100) / 100,
    };
  }
}

export const attendanceService = new AttendanceService();
