import { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";

export default function Kabupaten_Kota_Layer({
  selectedKabupaten,
  setSelectedKabupaten,
  setHoverInfo,
}) {
  const [kabupaten, setKabupaten] = useState(null);
  const [zisData, setZisData] = useState([]);

  useEffect(() => {
    // Fetch GeoJSON
    fetch("/data/geojson/kabupaten_kota.geojson")
      .then((res) => res.json())
      .then((data) => setKabupaten(data))
      .catch((err) => console.log(err));

    // Fetch ZIS data
    fetch("/data/zis_jabar.json")
      .then((res) => res.json())
      .then((data) => setZisData(data))
      .catch((err) => console.log(err));
  }, []);

  const getZisData = (namaKabupaten) => {
    return zisData.find(d => d.nama_kabkota.toUpperCase() === namaKabupaten.toUpperCase());
  };

  const getColor = (total) => {
    if (!total) return "#64B5F6";
    return total > 150000000000 ? '#800026' :
           total > 120000000000  ? '#BD0026' :
           total > 90000000000  ? '#E31A1C' :
           total > 60000000000  ? '#FC4E2A' :
           total > 30000000000   ? '#FD8D3C' :
           total > 10000000000   ? '#FEB24C' :
                                  '#FED976';
  };

  const styleFunction = (feature) => {
    const zis = getZisData(feature.properties.WADMKK);
    const fillColor = zis ? getColor(zis.total_zis) : "#64B5F6";

    // If a kabupaten is selected, dim others
    if (selectedKabupaten && feature.properties.WADMKK !== selectedKabupaten.properties.WADMKK) {
      return {
        opacity: 0,
        fillOpacity: 0,
      };
    }

    if (selectedKabupaten && feature.properties.WADMKK === selectedKabupaten.properties.WADMKK) {
      return {
        color: "#2E7D32",
        weight: 4,
        fillColor: fillColor,
        fillOpacity: 0.8,
      };
    }

    return {
      color: "#ffffff",
      weight: 1,
      fillColor: fillColor,
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature, layer) => {
    const p = feature.properties;
    const zis = getZisData(p.WADMKK);

    layer.on({
      mouseover(e) {
        if (selectedKabupaten?.properties?.WADMKK === p.WADMKK) return;

        e.target.setStyle({
          weight: 3,
          color: "#000",
          fillOpacity: 0.9,
        });

        setHoverInfo({
          level: "Kabupaten/Kota",
          nama: p.WADMKK,
          kabupaten: p.WADMKK,
          provinsi: p.WADMPR,
          zis: zis || null
        });
      },

      mouseout(e) {
        if (selectedKabupaten?.properties?.WADMKK === p.WADMKK) return;

        e.target.setStyle(styleFunction(feature));

        setHoverInfo(null);
      },

      click() {
        setSelectedKabupaten(feature);
      },
    });
  };

  if (!kabupaten) return null;

  return (
    <GeoJSON
      key={`${selectedKabupaten?.properties?.WADMKK || "kabupaten"}_${zisData.length}`}
      data={kabupaten}
      style={styleFunction}
      onEachFeature={onEachFeature}
    />
  );
}