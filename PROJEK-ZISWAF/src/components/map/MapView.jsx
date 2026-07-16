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

        {/* Layer Kabupaten/Kota */}
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
