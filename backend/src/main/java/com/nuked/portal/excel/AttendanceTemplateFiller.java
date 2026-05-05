package com.nuked.portal.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Reads a faculty-uploaded attendance template xlsx, finds the next free
 * column starting at F, writes the lecture date in row 1 (DD/MM/YYYY),
 * walks every student row matching column B (roll number) and writes 'P'
 * or 'A' from the supplied map. Returns the modified bytes — the original
 * template stored in the DB is not mutated.
 *
 * Layout assumed (per Sir Zeeshan's format):
 *   Row 1 = headers (S#, Roll No., Student Name, A, L, then date columns)
 *   Row 2..N = one student per row, roll number in column B (index 1)
 */
public class AttendanceTemplateFiller {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final int ROLL_COL = 1;       // column B (zero-indexed)
    private static final int FIRST_DATE_COL = 5; // column F (zero-indexed)

    /**
     * @param templateBytes the original xlsx as stored
     * @param lectureDate   the date of the session
     * @param presenceByRoll roll-no → "P" / "A" map
     */
    public static byte[] fill(byte[] templateBytes,
                              LocalDate lectureDate,
                              Map<String, String> presenceByRoll) throws IOException {
        try (InputStream in = new java.io.ByteArrayInputStream(templateBytes);
             XSSFWorkbook wb = new XSSFWorkbook(in);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.getSheetAt(0);
            String dateLabel = lectureDate.format(DATE_FMT);
            int dateCol = findOrCreateDateColumn(sheet, dateLabel);

            // Style for the new date header to match the sheet's header look.
            CellStyle headerStyle = sheet.getRow(0).getCell(0) != null
                    ? sheet.getRow(0).getCell(0).getCellStyle()
                    : wb.createCellStyle();

            Row hdr = sheet.getRow(0);
            Cell dateHdr = hdr.getCell(dateCol);
            if (dateHdr == null) dateHdr = hdr.createCell(dateCol);
            dateHdr.setCellValue(dateLabel);
            try { dateHdr.setCellStyle(headerStyle); } catch (Exception ignored) {}

            // Iterate student rows (2..N) and fill P/A.
            int last = sheet.getLastRowNum();
            for (int r = 1; r <= last; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Cell rollCell = row.getCell(ROLL_COL);
                if (rollCell == null) continue;
                String roll = readString(rollCell);
                if (roll == null || roll.isBlank()) continue;
                if (roll.equalsIgnoreCase("Roll No.") || roll.startsWith("Page ")) continue;
                String mark = presenceByRoll.getOrDefault(roll.trim(), "A");
                Cell c = row.getCell(dateCol);
                if (c == null) c = row.createCell(dateCol);
                c.setCellValue(mark);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    /** Find the column whose row-1 header equals dateLabel, or the next empty
     *  column starting at F. */
    private static int findOrCreateDateColumn(Sheet sheet, String dateLabel) {
        Row hdr = sheet.getRow(0);
        if (hdr == null) return FIRST_DATE_COL;
        int lastCellNum = hdr.getLastCellNum();
        for (int c = FIRST_DATE_COL; c < lastCellNum; c++) {
            Cell cell = hdr.getCell(c);
            if (cell == null) continue;
            String existing = readString(cell);
            if (existing != null && existing.equalsIgnoreCase(dateLabel)) return c;
        }
        // No matching column — append after the last filled one.
        return Math.max(FIRST_DATE_COL, lastCellNum < 0 ? FIRST_DATE_COL : lastCellNum);
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
