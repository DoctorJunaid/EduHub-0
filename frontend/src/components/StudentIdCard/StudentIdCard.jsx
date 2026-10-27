import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { User, QrCode, Phone, MapPin, Building2, Edit3, Save, X, RefreshCw, Printer } from "lucide-react";

export default function StudentIdCard({
  studentData,
  userRole = "student",
  onSaveStudentData,
  onRegenerateQr,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const getInitialData = (data) => ({
    studentId: data?._id || data?.id || data?.userId || "",
    instituteName: data?.instituteName || data?.campus || "EduHub Global Institute",
    instituteLogo: data?.instituteLogo || "",
    name: data?.name || "Danyal Mirza",
    classProgram:
      data?.classProgram ||
      (data?.gradeOrClass
        ? `${data.gradeOrClass}${data.section ? (String(data.section).toLowerCase().startsWith("section") ? ` • ${data.section}` : ` • Section ${data.section.replace(/^Section\s*/i, "")}`) : ""}`
        : data?.program || "Class 10 • Section A"),
    rollNo: data?.rollNo || data?.roll || data?.rollNumber || "EH-90214",
    fatherName: data?.fatherName || data?.guardian || "Tariq Mirza",
    guardianPhone:
      data?.guardianPhone ||
      data?.phone ||
      data?.studentPhone ||
      "+92 300 1234567",
    address: data?.address || "House 12, Street 4, Sector F-8/2, Islamabad",
    avatar: data?.avatar || data?.picture || "",
    qrCodeData:
      data?.qrCodeData ||
      data?.qrToken ||
      JSON.stringify({
        app: "EduHub",
        v: 1,
        type: "STUDENT_ATTENDANCE",
        studentId: data?._id || data?.id || data?.userId || "",
        rollNo: data?.rollNo || data?.roll || "1",
      }),
  });

  const [formData, setFormData] = useState(() => getInitialData(studentData));
  const [prevDataId, setPrevDataId] = useState(
    studentData?._id || studentData?.id || studentData?.rollNo || studentData?.roll
  );

  if ((studentData?._id || studentData?.id || studentData?.rollNo || studentData?.roll) !== prevDataId) {
    setPrevDataId(studentData?._id || studentData?.id || studentData?.rollNo || studentData?.roll);
    setFormData(getInitialData(studentData));
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSaveStudentData) {
      onSaveStudentData(formData);
    }
  };

  const canEdit =
    userRole === "campus_manager" ||
    userRole === "admin" ||
    userRole === "campus_admin" ||
    userRole === "super_admin";

  // Generate crisp QR code whenever qrCodeData or rollNo changes
  useEffect(() => {
    let active = true;
    const payload =
      formData.qrCodeData ||
      JSON.stringify({
        app: "EduHub",
        v: 1,
        type: "STUDENT_ATTENDANCE",
        studentId: formData.studentId,
        rollNo: formData.rollNo,
      });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "Q", // 25% error correction for durable long-term printed cards
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR data URL:", err);
      });

    return () => {
      active = false;
    };
  }, [formData.qrCodeData, formData.studentId, formData.rollNo]);

  const handleRegenerate = async () => {
    if (!onRegenerateQr || regenerating) return;
    try {
      setRegenerating(true);
      const res = await onRegenerateQr(formData.studentId);
      if (res?.qrCodeData) {
        setFormData((prev) => ({ ...prev, qrCodeData: res.qrCodeData }));
      }
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto select-none" style={{ gap: "16px" }}>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .student-id-card-printable,
          .student-id-card-printable * {
            visibility: visible !important;
          }
          .student-id-card-printable {
            position: absolute !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Controls Bar */}
      <div className="flex items-center justify-between w-full print:hidden" style={{ padding: "0 4px" }}>
        <div className="flex items-center" style={{ gap: "6px" }}>
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            style={{ padding: "6px 14px", height: "34px" }}
          >
            {isFlipped ? "View Front Side" : "View Back Side"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            title="Print ID Card"
            className="inline-flex items-center text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            style={{ padding: "6px 10px", height: "34px", gap: "4px" }}
          >
            <Printer className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

        {canEdit && (
          <div className="flex items-center" style={{ gap: "8px" }}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-xs cursor-pointer transition-colors"
                  style={{ padding: "6px 10px", height: "34px", gap: "4px" }}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs cursor-pointer transition-colors"
                  style={{ padding: "6px 12px", height: "34px", gap: "4px" }}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Data</span>
                </button>
              </>
            ) : (
              <div className="flex items-center" style={{ gap: "6px" }}>
                {onRegenerateQr && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    title="Regenerate QR Code"
                    className="inline-flex items-center text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    style={{ padding: "6px 10px", height: "34px", gap: "5px" }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${regenerating ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Regenerate QR</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                  style={{ padding: "6px 12px", height: "34px", gap: "6px" }}
                >
                  <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Edit ID Card</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ID Card Box with Blue Stripes */}
      <div
        className="student-id-card-printable w-full bg-white border border-neutral-200 rounded-2xl shadow-md overflow-hidden relative flex flex-col justify-between"
        style={{
          width: "340px",
          height: "540px",
          boxSizing: "border-box",
        }}
      >
        {!isFlipped ? (
          /* ================= FRONT SIDE ================= */
          <div className="flex flex-col h-full justify-between">
            {/* Top Light Blue Stripe Header */}
            <div
              className="flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #4da0ff 0%, #3b82f6 100%)",
                padding: "16px 20px",
                boxSizing: "border-box",
                color: "#ffffff",
              }}
            >
              <div className="flex items-center min-w-0" style={{ gap: "8px" }}>
                <div className="flex items-center justify-center text-white shrink-0">
                  {formData.instituteLogo ? (
                    <img src={formData.instituteLogo} alt="Logo" className="w-6 h-6 object-contain" />
                  ) : (
                    <Building2 className="w-4 h-4 text-white" />
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                    placeholder="Institute Name"
                    className="text-xs font-bold text-neutral-900 bg-white rounded px-1.5 py-0.5 w-full"
                  />
                ) : (
                  <span className="text-xs font-bold tracking-tight truncate max-w-[160px]" style={{ color: "#ffffff" }}>
                    {formData.instituteName}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ color: "#ffffff" }}
              >
                Student ID Card
              </span>
            </div>

            {/* Student Picture & Identity Details with Father Name on Front */}
            <div className="flex flex-col items-center text-center my-auto" style={{ gap: "14px", padding: "0 20px" }}>
              <div
                className="rounded-full bg-neutral-100 border-2 border-blue-200 overflow-hidden flex items-center justify-center text-neutral-400 shadow-md"
                style={{ width: "142px", height: "142px" }}
              >
                {formData.avatar ? (
                  <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-neutral-400 stroke-[1.5]" style={{ width: "66px", height: "66px" }} />
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col w-full" style={{ gap: "6px" }}>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleChange}
                    placeholder="Picture URL"
                    className="text-[11px] text-neutral-600 border border-neutral-300 rounded px-2 py-0.5 w-full text-center"
                  />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Student Name"
                    className="text-xs font-bold text-neutral-900 text-center border border-neutral-300 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="Father's Name"
                    className="text-xs text-neutral-700 text-center border border-neutral-300 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    name="classProgram"
                    value={formData.classProgram}
                    onChange={handleChange}
                    placeholder="Class / Program"
                    className="text-xs text-neutral-700 text-center border border-neutral-300 rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    placeholder="Roll No"
                    className="text-xs text-neutral-700 text-center font-mono border border-neutral-300 rounded px-2 py-1"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center" style={{ gap: "4px" }}>
                  <h3 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">
                    {formData.name}
                  </h3>

                  {/* Father's Name on Front Side */}
                  <div className="inline-flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      Father's Name:
                    </span>
                    <span className="font-semibold text-neutral-800">
                      {formData.fatherName || "—"}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-neutral-600 mt-1">
                    {formData.classProgram}
                  </p>

                  <p className="text-[11px] text-neutral-500 font-mono">
                    Roll No: <span className="font-bold text-blue-700 font-mono">{formData.rollNo}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Front Section: Academic Session & Blue Stripe */}
            <div className="flex flex-col items-center justify-center w-full" style={{ padding: "0 18px 16px 18px", gap: "10px" }}>
              <div
                className="w-full rounded-xl border border-neutral-200 flex items-center justify-center text-center"
                style={{ padding: "10px 14px", boxSizing: "border-box", background: "transparent" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Academic Session:
                  </span>
                  <span className="text-xs font-semibold text-neutral-800">
                    2025 – 2026
                  </span>
                </div>
              </div>
              <div className="w-full rounded-md" style={{ height: "8px", background: "linear-gradient(135deg, #4da0ff 0%, #3b82f6 100%)" }} />
            </div>
          </div>
        ) : (
          /* ================= BACK SIDE ================= */
          <div className="flex flex-col h-full justify-between">
            {/* Top Light Blue Stripe Header */}
            <div
              className="flex items-center justify-between"
              style={{
                background: "linear-gradient(135deg, #4da0ff 0%, #3b82f6 100%)",
                padding: "15px 18px",
                boxSizing: "border-box",
                color: "#ffffff",
              }}
            >
              <div>
                <h4
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "#ffffff", margin: 0, padding: 0 }}
                >
                  Guardian &amp; Contact Info
                </h4>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "rgba(255, 255, 255, 0.95)", margin: 0, padding: 0 }}
                >
                  If found, please return to institute.
                </p>
              </div>
              <span
                className="text-[11px] font-mono font-bold"
                style={{ color: "#ffffff" }}
              >
                ID: {formData.rollNo}
              </span>
            </div>

            {/* Back Side Body: Large QR Code at Top + Guardian Phone & Address Below */}
            <div className="flex flex-col my-auto" style={{ padding: "0 18px", gap: "12px" }}>
              {/* 1. Large QR Code at Top */}
              <div
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 flex flex-col items-center justify-center text-center shadow-2xs"
                style={{ padding: "12px 14px", gap: "8px" }}
              >
                <div className="bg-white p-2 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${formData.name}`}
                      style={{ width: "135px", height: "135px", imageRendering: "pixelated" }}
                    />
                  ) : (
                    <div
                      className="flex items-center justify-center bg-neutral-100 rounded-lg"
                      style={{ width: "135px", height: "135px" }}
                    >
                      <QrCode className="w-8 h-8 text-neutral-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-900">
                      Attendance Pass
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                      {formData.rollNo}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-0.5">
                    Scan to record attendance &amp; verify identity
                  </span>
                </div>
              </div>

              {/* 2. Guardian Contact Number & Residential Address Below QR Code */}
              {isEditing ? (
                <div className="flex flex-col" style={{ gap: "8px" }}>
                  <div className="flex flex-col" style={{ gap: "2px" }}>
                    <label className="text-[10px] uppercase font-semibold text-neutral-500">Guardian Phone</label>
                    <input
                      type="text"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      className="text-xs font-mono text-neutral-900 border border-neutral-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex flex-col" style={{ gap: "2px" }}>
                    <label className="text-[10px] uppercase font-semibold text-neutral-500">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="text-xs text-neutral-900 border border-neutral-300 rounded px-2 py-1 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col" style={{ gap: "10px" }}>
                  <div className="flex flex-col" style={{ gap: "2px" }}>
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                      Guardian Phone Number
                    </span>
                    <div className="flex items-center" style={{ gap: "6px" }}>
                      <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span className="text-xs font-semibold text-neutral-800 font-mono">
                        {formData.guardianPhone || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col" style={{ gap: "2px" }}>
                    <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                      Residential Address
                    </span>
                    <div className="flex items-start" style={{ gap: "6px" }}>
                      <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-neutral-700 leading-snug line-clamp-2">
                        {formData.address || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer & Blue Accent Stripe */}
            <div className="flex flex-col" style={{ padding: "0 16px 16px 16px", gap: "10px" }}>
              <div className="border-t border-neutral-200 pt-2.5 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Issued by EduHub</span>
                <span className="font-mono">ID: {formData.rollNo}</span>
              </div>
              <div className="w-full rounded-md" style={{ height: "8px", background: "linear-gradient(135deg, #4da0ff 0%, #3b82f6 100%)" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
