import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// We can register a standard web font for a cleaner look if desired, 
// but built-in fonts (Helvetica) work well for a minimalist Stripe-like feel.

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 20,
  },
  clinicInfo: {
    flexDirection: "column",
  },
  clinicName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  clinicSubtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  receiptTitle: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: "right",
  },
  receiptNumber: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "bold",
    textAlign: "right",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#64748b",
  },
  value: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "bold",
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTop: "1px solid #e2e8f0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "bold",
  },
  dueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px dashed #cbd5e1",
  },
  dueLabel: {
    fontSize: 12,
    color: "#ef4444",
  },
  dueValue: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 50,
    right: 50,
    flexDirection: "column",
    alignItems: "center",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: "#94a3b8",
  },
});

interface ReceiptPDFProps {
  receiptNumber: string;
  studentId: string;
  name: string;
  amountPaid: number;
  totalAgreedFee: number;
  date: string;
  existingPaidAmount?: number;
  transactionType?: string; // e.g. "Admission" or "Due Payment"
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({
  receiptNumber,
  studentId,
  name,
  amountPaid,
  totalAgreedFee,
  date,
  existingPaidAmount = 0,
  transactionType = "Payment Receipt",
}) => {
  // Calculate remaining due
  const totalPaidSoFar = existingPaidAmount + amountPaid;
  const remainingDue = Math.max(totalAgreedFee - totalPaidSoFar, 0);

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.clinicInfo}>
            <Text style={styles.clinicName}>Zahids Chem Clinic</Text>
            <Text style={styles.clinicSubtitle}>{transactionType}</Text>
          </View>
          <View>
            <Text style={styles.receiptTitle}>Receipt</Text>
            <Text style={styles.receiptNumber}>#{receiptNumber}</Text>
          </View>
        </View>

        {/* Student Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billed To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Student Name</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Student ID</Text>
            <Text style={styles.value}>{studentId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{date}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Agreed Fee</Text>
            <Text style={styles.value}>৳ {totalAgreedFee.toLocaleString()}</Text>
          </View>
          {existingPaidAmount > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Previously Paid</Text>
              <Text style={styles.value}>৳ {existingPaidAmount.toLocaleString()}</Text>
            </View>
          )}

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid Today</Text>
              <Text style={styles.totalValue}>৳ {amountPaid.toLocaleString()}</Text>
            </View>

            {remainingDue > 0 && (
              <View style={styles.dueRow}>
                <Text style={styles.dueLabel}>Remaining Due</Text>
                <Text style={styles.dueValue}>৳ {remainingDue.toLocaleString()}</Text>
              </View>
            )}
            
            {remainingDue === 0 && (
              <View style={[styles.dueRow, { borderTopColor: "#10b981" }]}>
                <Text style={[styles.dueLabel, { color: "#10b981" }]}>Status</Text>
                <Text style={[styles.dueValue, { color: "#10b981" }]}>Fully Paid</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for choosing Zahids Chem Clinic!</Text>
        </View>
      </Page>
    </Document>
  );
};
