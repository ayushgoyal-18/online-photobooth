import Webcam from "react-webcam";

export default function CameraCapture({ webcamRef, onReady }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} />
        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: "var(--text-sub)" }}>
          Camera
        </span>
      </div>
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/png"
        style={{ width: "100%", display: "block" }}
        mirrored
        onUserMedia={onReady}
      />
    </div>
  );
}