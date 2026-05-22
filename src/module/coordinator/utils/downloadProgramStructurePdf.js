import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function groupCoursesBySemester(courses) {
  const assigned = [];
  const unassigned = [];

  for (const c of courses || []) {
    const year = c.academic_year != null ? Number(c.academic_year) : null;
    const sem = c.semester_number != null ? Number(c.semester_number) : null;
    if (year && sem) assigned.push({ ...c, academic_year: year, semester_number: sem });
    else unassigned.push(c);
  }

  const map = new Map();
  for (const c of assigned) {
    const key = `${c.academic_year}-${c.semester_number}`;
    if (!map.has(key)) {
      map.set(key, {
        academic_year: c.academic_year,
        semester_number: c.semester_number,
        courses: [],
      });
    }
    map.get(key).courses.push(c);
  }

  const groups = [...map.values()].sort(
    (a, b) =>
      a.academic_year - b.academic_year ||
      a.semester_number - b.semester_number,
  );

  for (const g of groups) {
    g.courses.sort(
      (a, b) =>
        (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
        String(a.course_code || "").localeCompare(String(b.course_code || "")),
    );
  }

  if (unassigned.length) {
    groups.push({
      academic_year: null,
      semester_number: null,
      label: "COURSES NOT ASSIGNED TO A SEMESTER",
      courses: unassigned,
    });
  }

  return groups;
}

function formatPrerequisite(course) {
  const prereq = course.prerequisite_course;
  if (!prereq) return "";
  const code = prereq.course_code || "";
  const name = prereq.course_name || "";
  if (code && name) return `${code}\n${name}`;
  return code || name || "";
}

function buildSemesterTableBody(courses) {
  let totalCredits = 0;
  const rows = courses.map((c, idx) => {
    const credit = Number(c.course_credit) || 0;
    totalCredits += credit;
    return [
      String(idx + 1),
      c.course_code || "",
      c.category?.category_name || "",
      formatPrerequisite(c),
      c.course_name || "",
      credit ? String(credit) : "",
    ];
  });
  rows.push(["", "", "", "", "TOTAL", String(totalCredits)]);
  return rows;
}

/**
 * @param {{ programName: string, courses: object[] }} params
 */
export function downloadProgramStructurePdf({ programName, courses }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  const programTitle = String(programName || "PROGRAMME").toUpperCase();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(programTitle, pageWidth / 2, 16, { align: "center" });

  const titleWidth = doc.getTextWidth(programTitle);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - titleWidth / 2, 17.5, pageWidth / 2 + titleWidth / 2, 17.5);

  doc.setFontSize(10);
  doc.text("PROGRAMME STRUCTURE (FULL TIME)", pageWidth / 2, 24, { align: "center" });
  const subWidth = doc.getTextWidth("PROGRAMME STRUCTURE (FULL TIME)");
  doc.line(pageWidth / 2 - subWidth / 2, 25.5, pageWidth / 2 + subWidth / 2, 25.5);

  let startY = 32;
  const groups = groupCoursesBySemester(courses);

  if (groups.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No courses in this program.", margin, startY);
    doc.save(`programme-structure-${new Date().toISOString().slice(0, 10)}.pdf`);
    return;
  }

  const head = [["NO", "COURSE CODE", "CATEGORY", "PRE-REQ", "COURSE NAME", "CREDIT"]];

  for (const group of groups) {
    const sectionTitle =
      group.label ||
      `YEAR ${group.academic_year}: SEMESTER ${group.semester_number}`;

    const pageHeight = doc.internal.pageSize.getHeight();
    if (startY > pageHeight - 40) {
      doc.addPage();
      startY = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(sectionTitle, margin, startY);
    const sectionWidth = doc.getTextWidth(sectionTitle);
    doc.line(margin, startY + 1.5, margin + sectionWidth, startY + 1.5);
    startY += 7;

    autoTable(doc, {
      startY,
      head,
      body: buildSemesterTableBody(group.courses),
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 1.8,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 22 },
        2: { cellWidth: 28 },
        3: { cellWidth: 32 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 14, halign: "center" },
      },
      didParseCell: (data) => {
        if (
          data.section === "body" &&
          data.row.index === group.courses.length &&
          data.column.index === 4
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "right";
        }
        if (
          data.section === "body" &&
          data.row.index === group.courses.length &&
          data.column.index === 5
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    startY = (doc.lastAutoTable?.finalY || startY) + 8;
  }

  const slug = programTitle.replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "programme";
  doc.save(`${slug}-structure-${new Date().toISOString().slice(0, 10)}.pdf`);
}
