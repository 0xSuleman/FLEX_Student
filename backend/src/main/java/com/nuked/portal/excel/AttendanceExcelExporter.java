package com.nuked.portal.excel;

import com.nuked.portal.model.Attendance;
import com.nuked.portal.model.AttendanceSession;
import com.nuked.portal.model.FacultySection;
import com.nuked.portal.repository.AttendanceRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Per-section attendance roster sheet: rows = students, columns = closed
 * sessions sorted oldest→newest. Each cell is P / A / L. Last columns:
 * % present, total lectures.
 */
public class AttendanceExcelExporter {

    public record RosterRow(Long enrollmentId, String rollNo, String name) {}

    private final FacultySection section;
    private final List<RosterRow> roster;
    private final List<AttendanceSession> sessions;
    private final AttendanceRepository attendanceRepository;

    public AttendanceExcelExporter(FacultySection section,
                                   List<RosterRow> roster,
                                   List<AttendanceSession> sessions,
                                   AttendanceRepository attendanceRepository) {
        this.section = section;
        this.roster = roster;
        this.sessions = sessions;
        this.attendanceRepository = attendanceRepository;
    }

    public byte[] build() throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            buildSheet(wb);
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                wb.write(out);
                return out.toByteArray();
            }
        }
    }

    private void buildSheet(XSSFWorkbook wb) {
        XSSFSheet sheet = wb.createSheet("Attendance");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM d");

        XSSFCellStyle title = headerStyle(wb, new Color(60, 40, 20), Color.WHITE, 14);
        XSSFCellStyle header = headerStyle(wb, new Color(120, 80, 40), Color.WHITE, 11);
        XSSFCellStyle name = bodyStyle(wb, new Color(245, 240, 230), HorizontalAlignment.LEFT);
        XSSFCellStyle present = bodyStyle(wb, new Color(195, 230, 200), HorizontalAlignment.CENTER);
        XSSFCellStyle absent  = bodyStyle(wb, new Color(245, 200, 200), HorizontalAlignment.CENTER);
        XSSFCellStyle leave   = bodyStyle(wb, new Color(250, 235, 175), HorizontalAlignment.CENTER);
        XSSFCellStyle empty   = bodyStyle(wb, new Color(252, 252, 252), HorizontalAlignment.CENTER);

        int totalCols = 2 + sessions.size() + 2;

        Row r1 = sheet.createRow(0);
        Cell t = r1.createCell(0);
        t.setCellValue(String.format("FAST-NUCES · ATTENDANCE — %s · Sec %s · %s",
                section.getCourse().getCode(), section.getSection(), section.getSemester()));
        t.setCellStyle(title);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, Math.max(1, totalCols - 1)));
        r1.setHeightInPoints(24);

        // Header rows: lecture number then date
        Row hdr1 = sheet.createRow(1);
        Row hdr2 = sheet.createRow(2);
        Cell rh = hdr1.createCell(0); rh.setCellValue("ROLL");  rh.setCellStyle(header);
        Cell nh = hdr1.createCell(1); nh.setCellValue("NAME");  nh.setCellStyle(header);
        hdr2.createCell(0).setCellStyle(header);
        hdr2.createCell(1).setCellStyle(header);
        int c = 2;
        for (AttendanceSession s : sessions) {
            Cell h = hdr1.createCell(c); h.setCellValue("L" + (s.getLectureNo() == null ? "" : s.getLectureNo())); h.setCellStyle(header);
            Cell d = hdr2.createCell(c);
            String date = s.getStartedAt() == null ? "—"
                    : s.getStartedAt().atZone(ZoneId.systemDefault()).toLocalDate().format(fmt);
            d.setCellValue(date); d.setCellStyle(header);
            c++;
        }
        Cell pct = hdr1.createCell(c); pct.setCellValue("PRESENT %"); pct.setCellStyle(header);
        hdr2.createCell(c).setCellStyle(header);
        Cell tot = hdr1.createCell(c + 1); tot.setCellValue("TOTAL"); tot.setCellStyle(header);
        hdr2.createCell(c + 1).setCellStyle(header);

        // Body
        int rowIdx = 3;
        for (RosterRow rr : roster) {
            Row row = sheet.createRow(rowIdx);
            Cell rc = row.createCell(0); rc.setCellValue(rr.rollNo()); rc.setCellStyle(name);
            Cell nc = row.createCell(1); nc.setCellValue(rr.name());   nc.setCellStyle(name);

            int presentCount = 0;
            int graded = 0;
            int colIdx = 2;
            for (AttendanceSession s : sessions) {
                Optional<Attendance> a = attendanceRepository.findBySessionIdAndEnrollmentId(s.getId(), rr.enrollmentId());
                Cell cell = row.createCell(colIdx);
                if (a.isPresent() && a.get().getPresence() != null) {
                    String p = a.get().getPresence();
                    cell.setCellValue(p);
                    if ("P".equals(p)) { cell.setCellStyle(present); presentCount++; }
                    else if ("A".equals(p)) cell.setCellStyle(absent);
                    else if ("L".equals(p)) cell.setCellStyle(leave);
                    else cell.setCellStyle(empty);
                    graded++;
                } else {
                    cell.setCellValue("—");
                    cell.setCellStyle(empty);
                }
                colIdx++;
            }
            Cell pctCell = row.createCell(colIdx);
            pctCell.setCellValue(graded == 0 ? 0 : Math.round(100.0 * presentCount / graded));
            pctCell.setCellStyle(empty);
            Cell totCell = row.createCell(colIdx + 1);
            totCell.setCellValue(graded);
            totCell.setCellStyle(empty);
            rowIdx++;
        }

        sheet.createFreezePane(2, 3);
        for (int i = 0; i < totalCols; i++) sheet.autoSizeColumn(i);
        sheet.setColumnWidth(0, 4000);
        sheet.setColumnWidth(1, 7500);
    }

    private XSSFCellStyle headerStyle(XSSFWorkbook wb, Color bg, Color fg, int size) {
        XSSFCellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(new XSSFColor(bg, null));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        s.setBorderBottom(BorderStyle.MEDIUM);
        s.setBorderTop(BorderStyle.MEDIUM);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        Font f = wb.createFont();
        f.setBold(true);
        f.setColor(new XSSFColor(fg, null).getIndex());
        f.setFontHeightInPoints((short) size);
        s.setFont(f);
        return s;
    }

    private XSSFCellStyle bodyStyle(XSSFWorkbook wb, Color bg, HorizontalAlignment align) {
        XSSFCellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(new XSSFColor(bg, null));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setAlignment(align);
        return s;
    }
}
