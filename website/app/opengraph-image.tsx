import { ImageResponse } from "next/og";

export const alt = "NEVER — Your memory, without the maintenance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between", padding: "68px 80px", color: "#e9f1f7", background: "linear-gradient(125deg, #0a121c 0%, #203446 65%, #697c8d 100%)", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", fontSize: 23, letterSpacing: 10 }}>NEVER</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}><div style={{ display: "flex", fontSize: 70, letterSpacing: -3 }}>Your memory,</div><div style={{ display: "flex", fontSize: 70, letterSpacing: -3, color: "#abc3d5" }}>without the maintenance.</div></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#b1c5d4" }}><span>Capture. Remember. Recall.</span><span>Coming to iPhone</span></div>
    </div>, size,
  );
}
