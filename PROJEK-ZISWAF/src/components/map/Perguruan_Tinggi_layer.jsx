import { useEffect, useMemo, useState } from "react";
import { CircleMarker, Popup, Pane } from "react-leaflet"; // Tambahkan Pane di sini
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

/**
 * PerguruanTinggiLayer - POINT-IN-POLYGON VERSION (AKURAT)
 * Fitur:
 * - Marker HANYA muncul saat klik DESA
 * - Cek berdasarkan KOORDINAT (apakah kampus ada dalam polygon desa)
 * - Tidak bergantung pada kesamaan nama string
 * - Marker berada di lapisan atas (Pane) agar tidak tertimpa poligon desa
 */
export default function PerguruanTinggiLayer({ selectedKecamatan, selectedDesa }) {
  const [kampus, setKampus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeString = (str) => {
    if (!str) return "";
    return str
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  useEffect(() => {
    const paths = [
      "/data/geojson/perguruan_tinggi/kampus_data.geojson",
      "/data/geojson/kampus_data.geojson",
    ];

    const tryFetch = async (pathList, index = 0) => {
      if (index >= pathList.length) {
        const msg = `File tidak ditemukan`;
        console.error("❌", msg);
        setError(msg);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(pathList[index]);
        
        if (!response.ok) {
          return tryFetch(pathList, index + 1);
        }

        const data = await response.json();
        
        if (!data?.features) {
          throw new Error("Format tidak valid");
        }

        console.log(`✅ Kampus GeoJSON loaded: ${data.features.length} kampus`);
        setKampus(data);
        setLoading(false);
      } catch (err) {
        tryFetch(pathList, index + 1);
      }
    };

    tryFetch(paths);
  }, []);

  const filteredKampus = useMemo(() => {
    // ✅ HANYA render jika selectedDesa ada
    if (!kampus?.features || !selectedDesa) return [];

    // Ambil geometry desa yang diklik
    const desaGeometry = selectedDesa?.geometry;
    if (!desaGeometry) return [];

    const filtered = kampus.features.filter((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) return false;

      // ✅ POINT-IN-POLYGON: Cek apakah koordinat kampus ada dalam polygon desa
      try {
        const kampusPoint = point([coords[0], coords[1]]);
        const isInside = booleanPointInPolygon(kampusPoint, desaGeometry);
        return isInside;
      } catch (err) {
        console.warn("❌ Point-in-Polygon error:", err);
        return false;
      }
    });

    // Console log hanya untuk DESA
    if (selectedDesa) {
      const displayName = 
        selectedDesa.properties?.NAMOBJ || 
        selectedDesa.properties?.WADMKD || 
        "?";
      console.log(`📍 Kampus di DESA ${displayName}: ${filtered.length} kampus`);
    }

    return filtered;
  }, [kampus, selectedDesa]);

  if (loading) return null;
  if (error) {
    console.error("❌ Layer Error:", error);
    return null;
  }
  if (!kampus) {
    console.warn("⚠️ GeoJSON tidak berhasil di-load");
    return null;
  }

  return (
    // Bungkus dengan Pane dan beri zIndex tinggi (500) agar ada di atas layer poligon (400)
    <Pane name="kampus-pane" style={{ zIndex: 500 }}>
      {filteredKampus.map((feature, idx) => {
        const coords = feature.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;

        const namaKampus =
          feature.properties["Nama Perguruan Tinggi Negeri"] ||
          feature.properties["Nama Perguruan Tinggi"] ||
          feature.properties["Nama"] ||
          "Kampus";

        const kabupaten = feature.properties["Kabupaten/Kota"] || "-";
        const kecamatan = feature.properties["Kecamatan"] || "-";
        const kelurahan = feature.properties["Kelurahan"] || "-";

        return (
          <CircleMarker
            key={`kampus-${idx}`}
            center={[coords[1], coords[0]]}
            radius={8}
            pathOptions={{
              color: "white",
              fillColor: "#d32f2f",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: "250px", fontFamily: "Arial" }}>
                <div
                  style={{
                    color: "#d32f2f",
                    fontWeight: "bold",
                    fontSize: "14px",
                    marginBottom: "8px",
                    paddingBottom: "8px",
                    borderBottom: "2px solid #d32f2f",
                  }}
                >
                  {namaKampus}
                </div>
                <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                  <p style={{ margin: "4px 0" }}>
                    🏛️ {kabupaten}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    📍 {kecamatan}, {kelurahan}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </Pane>
  );
}