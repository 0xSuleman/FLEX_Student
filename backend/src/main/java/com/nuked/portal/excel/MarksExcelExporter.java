package com.nuked.portal.excel;

import com.nuked.portal.model.FacultySection;
import com.nuked.portal.model.MarksComponent;
import com.nuked.portal.model.MarksInstrument;
import com.nuked.portal.model.Marks;
import com.nuked.portal.repository.MarksRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFDataValidation;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * Generates a Flex-formatted marks-sheet template (req 4.5.3). Workbook layout:
 *   Sheet "Marks":
 *     Row 1 — title (merged)
 *     Row 2 — group header per instrument (merged across that instrument's components)
 *     Row 3 — component sub-header "Q1 (/5)"
 *     Row 4 — fixed columns "Roll" "Name" then component cells, blank for entry
 *   Sheet "__meta" (hidden):
 *     A1: sectionId | A2: semester | A3: templateVersion | A4: structureHash
 *
 * The structure hash is the upload-time integrity check used by the importer
 * to enforce req 4.5.4 (reject altered column count / order / labels).
 */
public class MarksExcelExporter {

    public static final String TEMPLATE_VERSION = "1";

    private final FacultySection section;
    private final List<MarksInstrument> instruments;
    private final List<RosterRow> roster;
    private final MarksRepository marksRepository;

    public record RosterRow(Long enrollmentId, String rollNo, String name) {}

    public MarksExcelExporter(FacultySection section,
                              List<MarksInstrument> instruments,
                              List<RosterRow> roster,
                              MarksRepository marksRepository) {
        this.section = section;
        this.instruments = instruments;
        this.roster = roster;
        this.marksRepository = marksRepository;
    }

    public byte[] build() throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            buildMarksSheet(wb);
            buildMetaSheet(wb);
            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                wb.write(out);
                return out.toByteArray();
            }
        }
    }

    private void buildMarksSheet(XSSFWorkbook wb) {
        XSSFSheet sheet = wb.createSheet("Marks");
        int totalCols = 2 + instruments.stream().mapToInt(i -> i.getComponents().size()).sum();

        XSSFCellStyle titleStyle = headerStyle(wb, new Color(60, 40, 20), Color.WHITE, true, 14);
        XSSFCellStyle groupStyle = headerStyle(wb, new Color(120, 80, 40), Color.WHITE, true, 11);
        XSSFCellStyle subStyle   = headerStyle(wb, new Color(230, 220, 200), Color.BLACK, true, 10);
        XSSFCellStyle lockedHeader = headerStyle(wb, new Color(180, 160, 130), Color.BLACK, true, 11);
        XSSFCellStyle scoreCell  = bodyStyle(wb, new Color(255, 252, 245));
        XSSFCellStyle nameCell   = bodyStyle(wb, new Color(245, 240, 230));

        // Row 1 — title
        Row r1 = sheet.createRow(0);
        Cell c0 = r1.createCell(0);
        c0.setCellValue(String.format("FAST-NUCES · FLEX MARKS SHEET — %s · Sec %s · %s",
                section.getCourse().getCode(), section.getSection(), section.getSemester()));
        c0.setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, Math.max(2, totalCols - 1)));
        r1.setHeightInPoints(24);

        // Row 2 — group header per instrument
        Row r2 = sheet.createRow(1);
        Cell rollHead = r2.createCell(0); rollHead.setCellValue("ROLL"); rollHead.setCellStyle(lockedHeader);
        Cell nameHead = r2.createCell(1); nameHead.setCellValue("NAME"); nameHead.setCellStyle(lockedHeader);
        int col = 2;
        for (MarksInstrument ins : instruments) {
            int span = ins.getComponents().size();
            Cell h = r2.createCell(col);
            h.setCellValue(ins.getName());
            h.setCellStyle(groupStyle);
            if (span > 1) sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, col, col + span - 1));
            col += span;
        }
        r2.setHeightInPoints(20);

        // Row 3 — component sub-header
        Row r3 = sheet.createRow(2);
        r3.createCell(0).setCellStyle(lockedHeader);
        r3.createCell(1).setCellStyle(lockedHeader);
        col = 2;
        for (MarksInstrument ins : instruments) {
            for (MarksComponent c : ins.getComponents()) {
                Cell h = r3.createCell(col);
                h.setCellValue(String.format("%s  (/%s)", c.getName(), trim(c.getMaxMarks())));
                h.setCellStyle(subStyle);
                col++;
            }
        }
        r3.setHeightInPoints(18);

        // Row 4+ — roster
        int rowIdx = 3;
        for (RosterRow rr : roster) {
            Row row = sheet.createRow(rowIdx);
            Cell c = row.createCell(0); c.setCellValue(rr.rollNo()); c.setCellStyle(nameCell);
            Cell n = row.createCell(1); n.setCellValue(rr.name());   n.setCellStyle(nameCell);
            int colIdx = 2;
            for (MarksInstrument ins : instruments) {
                for (MarksComponent comp : ins.getComponents()) {
                    Cell sc = row.createCell(colIdx);
                    sc.setCellStyle(scoreCell);
                    // Pre-fill any existing score so re-export round-trips cleanly.
                    Marks existing = marksRepository
                            .findByEnrollmentIdAndComponentId(rr.enrollmentId(), comp.getId())
                            .orElse(null);
                    if (existing != null && existing.getObtained() != null) {
                        sc.setCellValue(existing.getObtained());
                    }
                    colIdx++;
                }
            }
            rowIdx++;
        }

        // Data validation: each score column constrained [0, max]
        col = 2;
        for (MarksInstrument ins : instruments) {
            for (MarksComponent comp : ins.getComponents()) {
                CellRangeAddressList range = new CellRangeAddressList(3, Math.max(3, 3 + roster.size() - 1), col, col);
                DataValidationHelper helper = sheet.getDataValidationHelper();
                DataValidationConstraint constraint = helper.createDecimalConstraint(
                        DataValidationConstraint.OperatorType.BETWEEN, "0", String.valueOf(comp.getMaxMarks()));
                XSSFDataValidation dv = (XSSFDataValidation) helper.createValidation(constraint, range);
                dv.setShowErrorBox(true);
                dv.setErrorStyle(DataValidation.ErrorStyle.STOP);
                dv.createErrorBox("Out of range", "Enter 0 to " + comp.getMaxMarks());
                sheet.addValidationData(dv);
                col++;
            }
        }

        // Freeze the header rows + the roll/name columns so faculty can scroll
        // the marks grid without losing context.
        sheet.createFreezePane(2, 3);
        for (int i = 0; i < totalCols; i++) sheet.autoSizeColumn(i);
        sheet.setColumnWidth(0, 4000);
        sheet.setColumnWidth(1, 7500);
    }

    private void buildMetaSheet(XSSFWorkbook wb) {
        XSSFSheet meta = wb.createSheet("__meta");
        meta.createRow(0).createCell(0).setCellValue(section.getId());
        meta.createRow(1).createCell(0).setCellValue(section.getSemester());
        meta.createRow(2).createCell(0).setCellValue(TEMPLATE_VERSION);
        meta.createRow(3).createCell(0).setCellValue(structureHash(instruments));
        wb.setSheetHidden(wb.getSheetIndex(meta), true);
    }

    public static String structureHash(List<MarksInstrument> instruments) {
        StringBuilder sb = new StringBuilder();
        for (MarksInstrument ins : instruments) {
            for (MarksComponent c : ins.getComponents()) {
                sb.append(ins.getName()).append('|').append(c.getName()).append('|')
                  .append(trim(c.getMaxMarks())).append(',');
            }
        }
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : dig) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    private static String trim(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }

    private XSSFCellStyle headerStyle(XSSFWorkbook wb, Color bg, Color fg, boolean bold, int fontSize) {
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
        f.setBold(bold);
        f.setColor(IndexedColors.AUTOMATIC.getIndex());
        f.setFontHeightInPoints((short) fontSize);
        f.setColor(new XSSFColor(fg, null).getIndex());
        s.setFont(f);
        return s;
    }

    private XSSFCellStyle bodyStyle(XSSFWorkbook wb, Color bg) {
        XSSFCellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(new XSSFColor(bg, null));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setBorderBottom(BorderStyle.THIN);
        s.setBorderTop(BorderStyle.THIN);
        s.setBorderLeft(BorderStyle.THIN);
        s.setBorderRight(BorderStyle.THIN);
        s.setAlignment(HorizontalAlignment.CENTER);
        return s;
    }
}
