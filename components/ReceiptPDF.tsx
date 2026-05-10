import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// Register custom font if desired, but Helvetica is built-in and looks clean.
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  // --- Header ---
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 20,
    marginBottom: 30,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  clinicSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  paymentTypeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentTypeText: {
    fontSize: 10,
    color: "#334155",
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  // --- Body ---
  bodyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  column: {
    flexDirection: "column",
    width: "48%",
  },
  label: {
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    color: "#1e293b",
    marginBottom: 16,
    fontWeight: "bold",
  },

  // --- Financial Breakdown ---
  financialTable: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 40,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  borderBottom: {
    borderBottom: "1px solid #e2e8f0",
  },
  amountPaidRow: {
    backgroundColor: "#f8fafc",
  },
  amountPaidLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "bold",
  },
  amountPaidValue: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "bold",
  },
  remainingLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  remainingValue: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "bold",
  },

  // --- Footer ---
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#94a3b8",
  },
});

export interface ReceiptPDFProps {
  studentName: string;
  studentId: string;
  amountPaid: number;
  remainingDue: number;
  date: string;
  receiptNumber: string;
  paymentType: string;
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  studentName,
  studentId,
  amountPaid,
  remainingDue,
  date,
  receiptNumber,
  paymentType,
}) => {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>Zahid&apos;s Chem Clinic</Text>
            <Text style={styles.clinicSubtitle}>Official Money Receipt</Text>
          </View>
          <View style={styles.paymentTypeBadge}>
            <Text style={styles.paymentTypeText}>{paymentType}</Text>
          </View>
        </View>

        {/* Body Layout: Two Columns */}
        <View style={styles.bodyContainer}>
          {/* Left Column: Student Info */}
          <View style={styles.column}>
            <View>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>{studentName}</Text>
            </View>
            <View>
              <Text style={styles.label}>Student ID</Text>
              <Text style={styles.value}>{studentId}</Text>
            </View>
          </View>

          {/* Right Column: Transaction Details */}
          <View style={[styles.column, { alignItems: "flex-end" }]}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Receipt #</Text>
              <Text style={styles.value}>{receiptNumber}</Text>
            </View>
          </View>
        </View>

        {/* Financial Breakdown */}
        <View style={styles.financialTable}>
          <View style={[styles.financialRow, styles.borderBottom, styles.amountPaidRow]}>
            <Text style={styles.amountPaidLabel}>Amount Paid</Text>
            <Text style={styles.amountPaidValue}>Tk. {amountPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.remainingLabel}>Remaining Balance</Text>
            <Text style={styles.remainingValue}>
              {remainingDue > 0 ? `Tk. ${remainingDue.toLocaleString()}` : "Tk. 0 (Fully Paid)"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated automatically by ZCC Management System. For support, call 01841783983.
          </Text>
        </View>

      </Page>
    </Document>
  );
};
