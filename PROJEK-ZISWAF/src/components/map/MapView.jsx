import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import Kabupaten_Kota_Layer from "./Kabupaten_Kota_layer";
import Kecamatan_Layer from "./Kecamatan_layer";
import Sekolah_layer from "./Sekolah_layer";
import ZoomToFeature from "./ZoomToFeature";
import Desa_Kelurahan_layer from "./Desa_Kelurahan_layer";
import PerguruanTinggiLayer from "./Perguruan_Tinggi_layer";
import SearchBar from "./SearchBar";
import SummaryPanel from "./SummaryPanel";

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Map Error:", error, errorInfo);
    alert("Terjadi Error di Peta: " + error.toString() + "\n\n" + (errorInfo ? errorInfo.componentStack : ""));
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: "red", background: "#f8d7da", height: "100vh" }}>
          <h2>Something went wrong in the Map.</h2>
          <details style={{ whiteSpace: "pre-wrap" }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function MapView() {

  const [selectedKabupaten, setSelectedKabupaten] = useState(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [selectedDesa, setSelectedDesa] = useState(null);

  const [jumlahKK, setJumlahKK] = useState(null);

  React.useEffect(() => {
    fetch("/data/jumlah_kk.json")
      .then(res => res.json())
      .then(data => {
         const normalizedData = {};
         for (const kab in data) {
            const normKab = kab.toUpperCase().replace(/[^A-Z0-9]/g, "");
            normalizedData[normKab] = {};
            for (const kec in data[kab]) {
               const normKec = kec.toUpperCase().replace(/[^A-Z0-9]/g, "");
               normalizedData[normKab][normKec] = {};
               for (const desa in data[kab][kec]) {
                  const normDesa = desa.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  normalizedData[normKab][normKec][normDesa] = data[kab][kec][desa];
               }
            }
         }
         setJumlahKK(normalizedData);
      })
      .catch(console.error);
  }, []);

  const [hoverInfo, setHoverInfo] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const handleBack = () => {
    if (selectedDesa) {
      setSelectedDesa(null);
    } else if (selectedKecamatan) {
      setSelectedKecamatan(null);
    } else {
      setSelectedKabupaten(null);
    }
  };

  let hoverData = null;

  if (hoverInfo && jumlahKK) {
    let kab = hoverInfo.kabupaten ? hoverInfo.kabupaten.toUpperCase() : null;
    if (kab && !kab.startsWith("KABUPATEN ") && !kab.startsWith("KOTA ")) {
       kab = "KABUPATEN " + kab;
    }
    kab = kab ? kab.replace(/[^A-Z0-9]/g, "") : null;
    const nama = hoverInfo.nama ? hoverInfo.nama.toUpperCase().replace(/[^A-Z0-9]/g, "") : null;
    
    let sumKK = 0, sumPria = 0, sumWanita = 0;
    let sumUmur = { anak: 0, produktif: 0, lansia: 0 };
    let sumAgama = { islam: 0, kristen: 0, katholik: 0, hindu: 0, budha: 0, konghucu: 0, kepercayaan: 0 };
    let found = false;

    const addData = (dt) => {
       if (!dt) return;
       sumKK += dt.jumlah_kk || 0;
       sumPria += dt.pria || 0;
       sumWanita += dt.wanita || 0;
       if (dt.umur) {
          sumUmur.anak += dt.umur.anak || 0;
          sumUmur.produktif += dt.umur.produktif || 0;
          sumUmur.lansia += dt.umur.lansia || 0;
       }
       if (dt.agama) {
          for (const ag in sumAgama) {
             sumAgama[ag] += dt.agama[ag] || 0;
          }
       }
    };

    if (hoverInfo.level === "Desa/Kelurahan") {
       const kec = hoverInfo.kecamatan ? hoverInfo.kecamatan.toUpperCase().replace(/[^A-Z0-9]/g, "") : null;
       if (kab && kec && nama && jumlahKK[kab] && jumlahKK[kab][kec] && jumlahKK[kab][kec][nama]) {
          addData(jumlahKK[kab][kec][nama]);
          found = true;
       }
    } else if (hoverInfo.level === "Kecamatan") {
       if (kab && nama && jumlahKK[kab] && jumlahKK[kab][nama]) {
          for (const desa in jumlahKK[kab][nama]) {
             addData(jumlahKK[kab][nama][desa]);
          }
          found = true;
       }
    } else if (hoverInfo.level === "Kabupaten/Kota") {
       if (kab && jumlahKK[kab]) {
          for (const kec in jumlahKK[kab]) {
             for (const desa in jumlahKK[kab][kec]) {
                addData(jumlahKK[kab][kec][desa]);
             }
          }
          found = true;
       }
    }

    if (found) {
       hoverData = { sumKK, sumPria, sumWanita, sumUmur, sumAgama };
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
      }}
    >
      <SummaryPanel />

      {/* Tombol Kembali */}
      {selectedKabupaten && (
        <button
          onClick={handleBack}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            zIndex: 1000,
            background: "#1976D2",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            boxShadow: "0 2px 8px rgba(0,0,0,.3)",
          }}
        >
          ← Kembali
        </button>
      )}

      {/* Panel Informasi */}
{hoverInfo && (
  <div style={{ position: "absolute", right: 15, top: 100, zIndex: 9999, background: "#ffffff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", minWidth: "260px", maxWidth: "300px", pointerEvents: "none", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>
    <div style={{ background: "linear-gradient(135deg, #1976D2, #1565C0)", color: "#fff", padding: "16px 20px" }}>
      <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8, marginBottom: "4px" }}>{hoverInfo.level}</div>
      <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "2px" }}>{hoverInfo.nama}</div>
      <div style={{ fontSize: "13px", opacity: 0.9 }}>{hoverInfo.kabupaten}, {hoverInfo.provinsi}</div>
    </div>
    
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {hoverData && (
         <>
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
             <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Total KK</div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#222" }}>{hoverData.sumKK.toLocaleString("id-ID")}</div>
             </div>
             <div style={{ background: "#f8f9fa", padding: "12px", borderRadius: "10px" }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>Laki / Prp</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#222" }}>{hoverData.sumPria.toLocaleString("id-ID")} / {hoverData.sumWanita.toLocaleString("id-ID")}</div>
             </div>
           </div>

           <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
             <div style={{ fontSize: "12px", fontWeight: "600", color: "#444", marginBottom: "8px" }}>Kelompok Umur</div>
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#555", marginBottom: "4px" }}>
                <span>Anak (0-14 th):</span> <span style={{fontWeight:"600", color:"#222"}}>{hoverData.sumUmur.anak.toLocaleString("id-ID")}</span>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#555", marginBottom: "4px" }}>
                <span>Produktif (15-64 th):</span> <span style={{fontWeight:"600", color:"#222"}}>{hoverData.sumUmur.produktif.toLocaleString("id-ID")}</span>
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#555" }}>
                <span>Lansia (65+ th):</span> <span style={{fontWeight:"600", color:"#222"}}>{hoverData.sumUmur.lansia.toLocaleString("id-ID")}</span>
             </div>
           </div>
           
           <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
             <div style={{ fontSize: "12px", fontWeight: "600", color: "#444", marginBottom: "8px" }}>Agama</div>
             <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {Object.entries(hoverData.sumAgama).filter(([_, val]) => val > 0).sort((a,b) => b[1]-a[1]).slice(0,5).map(([agama, val]) => (
                   <div key={agama} style={{ background: "#e3f2fd", color: "#1565C0", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textTransform: "capitalize" }}>
                     {agama}: {val.toLocaleString("id-ID")}
                   </div>
                ))}
             </div>
           </div>
         </>
      )}

      {hoverInfo.zis && (
         <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
           <div style={{ fontSize: "12px", fontWeight: "600", color: "#444", marginBottom: "8px" }}>Potensi ZISWAF</div>
           <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#555" }}>
              <span>Total ZIS:</span> <span style={{fontWeight:"700", color: "#2E7D32"}}>Rp {(hoverInfo.zis.total_zis / 1000000000).toFixed(2)} M</span>
           </div>
         </div>
      )}
    </div>
  </div>
)}

      {/* Legend Tingkat Prioritas */}
      <div
        style={{
          position: "absolute",
          bottom: 30,
          left: 15,
          zIndex: 9999,
          background: "#fff",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          fontFamily: "sans-serif",
          fontSize: "14px",
          color: "#333",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "12px", color: "#192c55" }}>TINGKAT PRIORITAS</div>
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ width: "22px", height: "18px", background: "#f03b20", marginRight: "10px" }}></div>
          <span style={{ fontWeight: "500" }}>Sangat Tinggi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ width: "22px", height: "18px", background: "#fd8d3c", marginRight: "10px" }}></div>
          <span style={{ fontWeight: "500" }}>Tinggi</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ width: "22px", height: "18px", background: "#fed976", marginRight: "10px" }}></div>
          <span style={{ fontWeight: "500" }}>Sedang</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ width: "22px", height: "18px", background: "#74c476", marginRight: "10px" }}></div>
          <span style={{ fontWeight: "500" }}>Rendah</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ width: "22px", height: "18px", background: "#c7e9c0", marginRight: "10px" }}></div>
          <span style={{ fontWeight: "500" }}>Sangat Rendah</span>
        </div>
        
        <div style={{ fontSize: "12px", color: "#222", fontWeight: "600" }}>
          (Berdasarkan Indeks<br/>Komposit)
        </div>
      </div>

      <MapContainer
        center={[-6.90389, 107.61861]}
        zoom={8}
        minZoom={8}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <SearchBar />
        <TileLayer
          attribution="&copy; OpenStreetMap & CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <Kabupaten_Kota_Layer
          selectedKabupaten={selectedKabupaten}
          setSelectedKabupaten={setSelectedKabupaten}
              setHoverInfo={setHoverInfo}

        />

        {/* Layer Kecamatan */}
        <Kecamatan_Layer
        selectedKabupaten={selectedKabupaten}
        selectedKecamatan={selectedKecamatan}
        setSelectedKecamatan={setSelectedKecamatan}
        setHoverInfo={setHoverInfo}
        />

        {/* Layer Desa/Kelurahan */}
        <Desa_Kelurahan_layer
          selectedKabupaten={selectedKabupaten}
          selectedKecamatan={selectedKecamatan}
          selectedDesa={selectedDesa}
          setSelectedDesa={setSelectedDesa}
          setHoverInfo={setHoverInfo}
        />

        {/* Titik Sekolah (SD/SMP/SMA), muncul begitu desa dipilih */}
        <Sekolah_layer
          selectedKabupaten={selectedKabupaten}
          selectedKecamatan={selectedKecamatan}
          selectedDesa={selectedDesa}
        />

        {/* Titik Perguruan Tinggi */}
        <PerguruanTinggiLayer 
          selectedKabupaten={selectedKabupaten}
          selectedKecamatan={selectedKecamatan}
          selectedDesa={selectedDesa}
        />

        {/* Zoom Kabupaten */}
        {selectedKabupaten && !selectedKecamatan && !selectedDesa && (
          <ZoomToFeature feature={selectedKabupaten} />
        )}

        {/* Zoom Kecamatan */}
        {selectedKecamatan && !selectedDesa && (
          <ZoomToFeature feature={selectedKecamatan} />
        )}

        {/* Zoom Desa */}
        {selectedDesa && (
          <ZoomToFeature feature={selectedDesa} />
        )}
      </MapContainer>
    </div>
  );
}

export default function MapWrapper() {
  return (
    <MapErrorBoundary>
      <MapView />
    </MapErrorBoundary>
  );
}
