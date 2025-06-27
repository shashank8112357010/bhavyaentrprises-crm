"use client"
import React, { useState } from "react";

interface JcrItem {
  description: string;
  quantity: number;
  remarks?: string;
  category?: string;
}

interface JcrReport {
  jcrNo: string;
  name: string;
  date: string;
  jcrItems: JcrItem[];
}

const mockJcrReports: JcrReport[] = [
  {
    jcrNo: "JCR-001",
    name: "Client A",
    date: "2025-06-26",
    jcrItems: [
      {
        description: "Installed AC Unit",
        quantity: 2,
        remarks: "Living Room & Bedroom",
        category: "Installation",
      },
      {
        description: "Wiring",
        quantity: 50,
        remarks: "Meters",
        category: "Electrical",
      },
    ],
  },
  {
    jcrNo: "JCR-002",
    name: "Client B",
    date: "2025-06-25",
    jcrItems: [
      {
        description: "Service Visit",
        quantity: 1,
        remarks: "Routine checkup",
        category: "Service",
      },
    ],
  },
];

// New version: Accepts optional quotationId
const downloadJcrPdf = async (report: JcrReport, quotationId?: string) => {
  try {
    const response = await fetch("/api/jcr/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jcrNo: report.jcrNo,
        name: report.name,
        date: report.date,
        ...(quotationId ? { quotationId } : { jcrItems: report.jcrItems }),
      }),
    });
    if (!response.ok) throw new Error("Failed to generate PDF");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${report.jcrNo}_jcr.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error downloading PDF: " + (e as Error).message);
  }
};

const JcrReportsPage = () => {
  const [reports] = useState<JcrReport[]>(mockJcrReports);
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>JCR Reports</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>JCR No.</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Client</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Date</th>
            <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: 8 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.jcrNo}>
              <td style={{ padding: 8 }}>{report.jcrNo}</td>
              <td style={{ padding: 8 }}>{report.name}</td>
              <td style={{ padding: 8 }}>{report.date}</td>
              <td style={{ padding: 8 }}>
                <button
                  style={{
                    background: "#2d5016",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    cursor: "pointer",
                  }}
                  onClick={() => downloadJcrPdf(report)}
                >
                  Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: '#888', fontSize: 12 }}>
        (This is demo data. Integrate with real data as needed.)
      </div>
    </div>
  );
};

export default JcrReportsPage;