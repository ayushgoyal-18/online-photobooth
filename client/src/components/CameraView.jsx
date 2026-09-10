import Webcam from "react-webcam";

export default function CameraView({ webcamRef, isMirrored = false }) {
  return (
    <Webcam
      ref={webcamRef}
      screenshotFormat="image/png"
      style={{ width: "100%", borderRadius: 14, display: "block" }}
      mirrored={isMirrored}
    />
  );
}