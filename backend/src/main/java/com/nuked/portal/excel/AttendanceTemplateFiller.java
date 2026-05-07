package com.nuked.portal.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * Reads a faculty-uploaded attendance template xlsx, appends one column per
 * session (could be multiple in one day for makeup classes), writes 'P' /
 * 'A' / 'L' from the supplied per-session map, and updates cumulative A/L
 * hour totals in columns D and E. Returns the modified bytes — the original
 * template stored in the DB is not mutated.
 *
 * Layout assumed (per Sir Zeeshan's format):
 *   Row 1 = headers (S#, Roll No., Student Name, A, L, then date columns)
 *   Row 2..N = one student per row, roll number in column B (index 1)
 */
public class AttendanceTemplateFiller {

    private static final int ROLL_COL = 1;        // column B (zero-indexed)
    private static final int ABSENT_COL = 3;      // column D — total absent hours
    private static final int LATE_COL = 4;        // column E — total late hours
    private static final int FIRST_DATE_COL = 5;  // column F (zero-indexed)

    /** One column to append: header label + per-roll P/A/L. */
    public static class SessionFill {
        public final String columnLabel;
        public final Map<String, String> presenceByRoll;
        public SessionFill(String columnLabel, Map<String, String> presenceByRoll) {
            this.columnLabel = columnLabel;
            this.presenceByRoll = presenceByRoll;
        }
    }

    /**
     * Append one column per supplied session and refresh the A/L hour totals.
     * @param templateBytes      the original xlsx as stored
     * @param sessions           ordered list of sessions to write (one column each)
     * @param absentHoursByRoll  roll-no → cumulative absent hours across the semester
     * @param lateHoursByRoll    roll-no → cumulative late hours across the semester
     */
    public static byte[] fill(byte[] templateBytes,
                              List<SessionFill> sessions,
                              Map<String, Double> absentHoursByRoll,
                              Map<String, Double> lateHoursByRoll) throws IOException {
        try (InputStream in = new java.io.ByteArrayInputStream(templateBytes);
             XSSFWorkbook wb = new XSSFWorkbook(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.getSheetAt(0);
            Row hdr = sheet.getRow(0);
            CellStyle headerStyle = (hdr != null && hdr.getCell(0) != null)
                    ? hdr.getCell(0).getCellStyle()
                    : wb.createCellStyle();
            int last = sheet.getLastRowNum();

            // Pass 1: append one column per session, write its header + per-row presences.
            for (SessionFill sf : sessions) {
                int col = findOrCreateColumn(sheet, sf.columnLabel);
                Cell h = hdr.getCell(col);
                if (h == null) h = hdr.createCell(col);
                h.setCellValue(sf.columnLabel);
                try { h.setCellStyle(headerStyle); } catch (Exception ignored) {}

                for (int r = 1; r <= last; r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) continue;
                    Cell rollCell = row.getCell(ROLL_COL);
                    if (rollCell == null) continue;
                    String roll = readString(rollCell);
                    if (roll == null || roll.isBlank()) continue;
                    if (roll.equalsIgnoreCase("Roll No.") || roll.startsWith("Page ")) continue;
                    String key = roll.trim();
                    String mark = sf.presenceByRoll.getOrDefault(key, "A");
                    Cell c = row.getCell(col);
                    if (c == null) c = row.createCell(col);
                    c.setCellValue(mark);
                }
            }

            // Pass 2: write cumulative A/L hours per student (one row each).
            for (int r = 1; r <= last; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Cell rollCell = row.getCell(ROLL_COL);
                if (rollCell == null) continue;
                String roll = readString(rollCell);
                if (roll == null || roll.isBlank()) continue;
                if (roll.equalsIgnoreCase("Roll No.") || roll.startsWith("Page ")) continue;
                String key = roll.trim();
                writeNumeric(row, ABSENT_COL, absentHoursByRoll.getOrDefault(key, 0.0));
                writeNumeric(row, LATE_COL, lateHoursByRoll.getOrDefault(key, 0.0));
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    /** Find the column whose row-1 header equals label, or the next empty
     *  column starting at F. */
    private static int findOrCreateColumn(Sheet sheet, String label) {
        Row hdr = sheet.getRow(0);
        if (hdr == null) return FIRST_DATE_COL;
        int lastCellNum = hdr.getLastCellNum();
        for (int c = FIRST_DATE_COL; c < lastCellNum; c++) {
            Cell cell = hdr.getCell(c);
            if (cell == null) continue;
            String existing = readString(cell);
            if (existing != null && existing.equalsIgnoreCase(label)) return c;
        }
        return Math.max(FIRST_DATE_COL, lastCellNum < 0 ? FIRST_DATE_COL : lastCellNum);
    }

    private static void writeNumeric(Row row, int col, double value) {
        Cell c = row.getCell(col);
        if (c == null) c = row.createCell(col);
        if (value == Math.floor(value)) c.setCellValue((int) value);
        else c.setCellValue(value);
    }

    private static String readString(Cell c) {
        if (c == null) return null;
        switch (c.getCellType()) {
            case STRING: return c.getStringCellValue();
            case NUMERIC: return String.valueOf((long) c.getNumericCellValue());
            case BOOLEAN: return String.valueOf(c.getBooleanCellValue());
            default: return null;
        }
    }
}
