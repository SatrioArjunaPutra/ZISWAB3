import { useEffect, useMemo, useState } from "react";
import { GeoJSON } from "react-leaflet";

export default function Kecamatan_Layer({

    selectedKabupaten,
    selectedKecamatan,
    setSelectedKecamatan,
    setHoverInfo,
}) {

    const [kecamatan, setKecamatan] = useState(null);

    useEffect(() => {

        fetch("/data/geojson/kecamatan.geojson")

            .then(res => res.json())
            .then(data => setKecamatan(data))
            .catch(console.error);

    }, []);



        const filteredKecamatan = useMemo(() => {

        if (!kecamatan) return null;

        if (!selectedKabupaten) return null;

        return {

            type: "FeatureCollection",

            features: kecamatan.features.filter(

                feature =>

                    feature.properties.WADMKK ===
                    selectedKabupaten.properties.WADMKK

            )

        };

    }, [

        kecamatan,
        selectedKabupaten

    ]);



    const defaultStyle = {

        color: "#E53935",
        weight: 1.5,
        fillColor: "#EF5350",
        fillOpacity: 0.15,

    };

    const hoverStyle = {

        color: "#FB8C00",
        weight: 3,
        fillColor: "#FFB74D",
        fillOpacity: 0.45,

    };

    const selectedStyle = {

        color: "#2E7D32",
        weight: 3,
        fillColor: "#66BB6A",
        fillOpacity: 0.5,

    };

    const styleFunction = (feature) => {
        if (selectedKecamatan) {
            if (selectedKecamatan.properties.WADMKC === feature.properties.WADMKC) {
                return {
                    color: "#2E7D32",
                    weight: 3,
                    fillOpacity: 0,
                };
            }
            return {
                ...defaultStyle,
                fillOpacity: 0.05,
                opacity: 0.5,
            };
        }
        return defaultStyle;
    };

        const onEachFeature = (feature, layer) => {

        const p = feature.properties;


        layer.on({

            mouseover(e) {

    if(selectedKecamatan?.properties?.WADMKC === p.WADMKC)
        return;

    e.target.setStyle(hoverStyle);

    setHoverInfo({

        level: "Kecamatan",

        nama: p.WADMKC,

        kabupaten: p.WADMKK,

        provinsi: p.WADMPR

    });

},

            mouseout(e){

    if(selectedKecamatan?.properties?.WADMKC === p.WADMKC)
        return;

    e.target.setStyle(defaultStyle);

    setHoverInfo(null);

},

            click(){

                setSelectedKecamatan(feature);

            }

        });

    };



    if (!filteredKecamatan) return null;

    return (
        <GeoJSON
            key={selectedKabupaten?.properties?.WADMKK || "kecamatan"}
            data={filteredKecamatan}
            style={styleFunction}
            onEachFeature={onEachFeature}
        />
    );
}