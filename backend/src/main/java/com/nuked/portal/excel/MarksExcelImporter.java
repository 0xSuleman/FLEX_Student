package com.nuked.portal.excel;

import com.nuked.portal.dto.UploadResultDTO;
import com.nuked.portal.model.MarksComponent;
import com.nuked.portal.model.MarksInstrument;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parses + validates an uploaded marks sheet against the section's current
 * instrument layout. Enforces req 4.5.4: rejects any sheet whose column count,
 * order, or labels diverge from the Flex-exported format.
 *
 * Returns a structured result so the UI can highlight per-row errors.
 */
public class MarksExcelImporter {

    public record ParsedScore(String rollNo, Long componentId, Double obtained, int rowNumber) {}

    public record ParseOutcome(UploadResultDTO summary, List<ParsedScore> scores) {}

    private final Long expectedSectionId;
    private final List<MarksInstrument> currentInstruments;

    public MarksExcelImporter(Long expectedSectionId, List<MarksInstrument> currentInstruments) {
        this.expectedSectionId = expectedSectionId;
        this.currentInstruments = currentInstruments;
    }

    public ParseOutcome parse(InputStream in) throws IOException {
        UploadResultDTO summary = new UploadResultDTO();
        List<ParsedScore> out = new ArrayList<>();

        try (XSSFWorkbook wb = new XSSFWorkbook(in)) {
            Sheet meta = wb.getSheet("__meta");
            Sheet marks = wb.getSheet("Marks");

            if (meta == null || marks == null) {
                summary.getStructureErrors().add("Missing required sheets — expected 'Marks' and '__meta'.");
                summary.setOk(false);
                return new ParseOutcome(summary, out);
            }

            // ── Meta validation ──
            long metaSectionId = (long) numCell(meta.getRow(0), 0, -1);
            String metaVersion = strCell(meta.getRow(2), 0);
            String metaHash    = strCell(meta.getRow(3), 0);
            if (metaSectionId != expectedSectionId) {
                summary.getStructureErrors().add(
                        "Section ID mismatch: file is for section " + metaSectionId +
                        ", uploaded to section " + expectedSectionId + ".");
            }
            if (!MarksExcelExporter.TEMPLATE_VERSION.equals(metaVersion)) {
                summary.getStructureErrors().add(
                        "Template version mismatch: expected " + MarksExcelExporter.TEMPLATE_VERSION +
                        ", got " + metaVersion + ". Re-download the template.");
            }
            String currentHash = MarksExcelExporter.structureHash(currentInstruments);
            if (!currentHash.equals(metaHash)) {
                summary.getStructureErrors().add(
                        "Sheet structure has been altered since download (req 4.5.4): " +
                        "column count, order, or labels differ from the Flex-exported format. " +
                        "Re-download the template, fill it in, and try again.");
            }

            // Build expected column → componentId map in display order.
            List<Long> componentByCol = new ArrayList<>();
            List<String> componentLabels = new ArrayList<>();
            componentByCol.add(null); componentByCol.add(null);     // Roll, Name
            componentLabels.add("ROLL"); componentLabels.add("NAME");
            for (MarksInstrument ins : currentInstruments) {
                for (MarksComponent c : ins.getComponents()) {
                    componentByCol.add(c.getId());
                    componentLabels.add(String.format("%s  (/%s)", c.getName(), trim(c.getMaxMarks())));
                }
            }

            // ── Row 2 + Row 3 label check (defense in depth — covers cases
            //    where someone faked a matching hash but moved labels around) ──
            Row row3 = marks.getRow(2);
            if (row3 == null) {
                summary.getStructureErrors().add("Sheet 'Marks' missing component sub-header row.");
            } else {
                for (int col = 2; col < componentByCol.size(); col++) {
                    String got = strCell(row3, col);
                    if (!componentLabels.get(col).equalsIgnoreCase(got == null ? "" : got.trim())) {
                        summary.getStructureErrors().add(String.format(
                                "Header mismatch at column %d: expected '%s', got '%s'.",
                                col + 1, componentLabels.get(col), got));
                    }
                }
            }

            if (!summary.getStructureErrors().isEmpty()) {
                summary.setOk(false);
                return new ParseOutcome(summary, out);
            }

            // ── Body parse ──
            Map<Long, Double> maxByComp = new HashMap<>();
            for (MarksInstrument ins : currentInstruments) {
                for (MarksComponent c : ins.getComponents()) maxByComp.put(c.getId(), c.getMaxMarks());
            }

            int parsed = 0;
            int firstDataRow = 3;
            for (int r = firstDataRow; r <= marks.getLastRowNum(); r++) {
                Row row = marks.getRow(r);
                if (row == null) continue;
                String rollNo = strCell(row, 0);
                if (rollNo == null || rollNo.isBlank()) continue;

                for (int col = 2; col < componentByCol.size(); col++) {
                    Long compId = componentByCol.get(col);
                    Cell cell = row.getCell(col);
                    if (cell == null || cell.getCellType() == CellType.BLANK) continue;
                    Double v = readNumeric(cell);
                    if (v == null) {
                        summary.getErrors().add(new UploadResultDTO.RowError(
                                r + 1, rollNo, "Non-numeric value in column " + (col + 1)));
                        continue;
                    }
                    double max = maxByComp.getOrDefault(compId, 0.0);
                    if (v < 0 || v > max + 0.0001) {
                        summary.getErrors().add(new UploadResultDTO.RowError(
                                r + 1, rollNo,
                                "Score " + v + " out of range [0, " + max + "] in column " + (col + 1)));
                        continue;
                    }
                    out.add(new ParsedScore(rollNo, compId, v, r + 1));
                    parsed++;
                }
            }
            summary.setRowsParsed(parsed);
            summary.setOk(summary.getStructureErrors().isEmpty() && summary.getErrors().isEmpty());
            return new ParseOutcome(summary, out);
        }
    }

    private static String strCell(Row row, int col) {
        if (row == null) return null;
        Cell c = row.getCell(col);
        if (c == null) return null;
        return switch (c.getCellType()) {
            case STRING -> c.getStringCellValue();
            case NUMERIC -> String.valueOf((long) c.getNumericCellValue());
            default -> null;
        };
    }

    private static double numCell(Row row, int col, double dflt) {
        if (row == null) return dflt;
        Cell c = row.getCell(col);
        if (c == null) return dflt;
        return c.getCellType() == CellType.NUMERIC ? c.getNumericCellValue() : dflt;
    }

    private static Double readNumeric(Cell cell) {
        try {
            return switch (cell.getCellType()) {
                case NUMERIC -> cell.getNumericCellValue();
                case STRING -> {
                    String s = cell.getStringCellValue().trim();
                    if (s.isEmpty()) yield null;
                    yield Double.parseDouble(s);
                }
                case FORMULA -> cell.getNumericCellValue();
                default -> null;
            };
        } catch (NumberFormatException | IllegalStateException ex) {
            return null;
        }
    }

    private static String trim(double d) {
        return d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
    }
}
