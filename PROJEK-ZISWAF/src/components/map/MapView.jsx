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

  let hoverJumlahKK = null;
  let hoverPria = null;
  let hoverWanita = null;

  if (hoverInfo && jumlahKK) {
    let kab = hoverInfo.kabupaten ? hoverInfo.kabupaten.toUpperCase() : null;
    if (kab && !kab.startsWith("KABUPATEN ") && !kab.startsWith("KOTA ")) {
       kab = "KABUPATEN " + kab;
    }
    kab = kab ? kab.replace(/[^A-Z0-9]/g, "") : null;
    
    const nama = hoverInfo.nama ? hoverInfo.nama.toUpperCase().replace(/[^A-Z0-9]/g, "") : null;
    
    if (hoverInfo.level === "Desa/Kelurahan") {
       const kec = hoverInfo.kecamatan ? hoverInfo.kecamatan.toUpperCase().replace(/[^A-Z0-9]/g, "") : null;
       if (kab && kec && nama && jumlahKK[kab] && jumlahKK[kab][kec] && jumlahKK[kab][kec][nama] !== undefined) {
          const dt = jumlahKK[kab][kec][nama];
          hoverJumlahKK = (dt.jumlah_kk || 0).toLocaleString("id-ID") + " KK";
          hoverPria = (dt.pria || 0).toLocaleString("id-ID") + " Jiwa";
          hoverWanita = (dt.wanita || 0).toLocaleString("id-ID") + " Jiwa";
       }
    } else if (hoverInfo.level === "Kecamatan") {
       if (kab && nama && jumlahKK[kab] && jumlahKK[kab][nama]) {
          const vals = Object.values(jumlahKK[kab][nama]);
          const sumKK = vals.reduce((a, b) => a + (b.jumlah_kk || 0), 0);
          const sumPria = vals.reduce((a, b) => a + (b.pria || 0), 0);
          const sumWanita = vals.reduce((a, b) => a + (b.wanita || 0), 0);
          hoverJumlahKK = sumKK.toLocaleString("id-ID") + " KK";
          hoverPria = sumPria.toLocaleString("id-ID") + " Jiwa";
          hoverWanita = sumWanita.toLocaleString("id-ID") + " Jiwa";
       }
    } else if (hoverInfo.level === "Kabupaten/Kota") {
       if (kab && jumlahKK[kab]) {
          let sumKK = 0;
          let sumPria = 0;
          let sumWanita = 0;
          for (const kec in jumlahKK[kab]) {
             for (const desa in jumlahKK[kab][kec]) {
                sumKK += jumlahKK[kab][kec][desa].jumlah_kk || 0;
                sumPria += jumlahKK[kab][kec][desa].pria || 0;
                sumWanita += jumlahKK[kab][kec][desa].wanita || 0;
             }
          }
          hoverJumlahKK = sumKK.toLocaleString("id-ID") + " KK";
          hoverPria = sumPria.toLocaleString("id-ID") + " Jiwa";
          hoverWanita = sumWanita.toLocaleString("id-ID") + " Jiwa";
       }
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
  <div
    style={{
      position: "absolute",
      right: 15,
      top: 100,

      zIndex: 9999,

      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 5px 20px rgba(0,0,0,.25)",

      minWidth: "220px",

      pointerEvents: "none",
      overflow: "hidden",
    }}
  >
    <div
  style={{
    background: "#1976D2",
    color: "#fff",
    padding: "10px 15px",
    fontWeight: "600",
    fontSize: "18px"
  }}
>
 Informasi Wilayah
</div>

  <div style={{ padding: "12px 15px", fontSize: "14px" }}>
  <table style={{ width: "100%" }}>
    <tbody>
      <tr>
        <td><b>Nama</b></td>
        <td>{hoverInfo.nama}</td>
      </tr>

      <tr>
        <td><b>Level</b></td>
        <td>{hoverInfo.level}</td>
      </tr>

      <tr>
        <td><b>Kab/Kota</b></td>
        <td>{hoverInfo.kabupaten}</td>
      </tr>

      <tr>
        <td><b>Provinsi</b></td>
        <td>{hoverInfo.provinsi}</td>
      </tr>
      {hoverJumlahKK && (
        <>
          <tr>
            <td><b>Jumlah KK</b></td>
            <td>{hoverJumlahKK}</td>
          </tr>
          <tr>
            <td><b>Laki-laki</b></td>
            <td>{hoverPria}</td>
          </tr>
          <tr>
            <td><b>Perempuan</b></td>
            <td>{hoverWanita}</td>
          </tr>
        </>
      )}
      {hoverInfo.jumlah_kk && !hoverJumlahKK && (
        <tr>
          <td><b>Jumlah KK</b></td>
          <td>{hoverInfo.jumlah_kk}</td>
        </tr>
      )}
      {hoverInfo.zis && (
        <>
          <tr>
            <td><hr /></td>
            <td><hr /></td>
          </tr>
          <tr>
            <td><b>Zakat Maal</b></td>
            <td>Rp {(hoverInfo.zis.zakat_maal / 1000000000).toFixed(2)} M</td>
          </tr>
          <tr>
            <td><b>Zakat Fitrah</b></td>
            <td>Rp {(hoverInfo.zis.zakat_fitrah / 1000000000).toFixed(2)} M</td>
          </tr>
          <tr>
            <td><b>Infak</b></td>
            <td>Rp {(hoverInfo.zis.infak / 1000000000).toFixed(2)} M</td>
          </tr>
          <tr>
            <td><b>Total ZIS</b></td>
            <td><b>Rp {(hoverInfo.zis.total_zis / 1000000000).toFixed(2)} M</b></td>
          </tr>
        </>
      )}
    </tbody>
  </table>
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
