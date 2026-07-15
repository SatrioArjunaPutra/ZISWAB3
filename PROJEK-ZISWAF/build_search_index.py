import pandas as pd
import json
import math

def build_index():
    print("Membaca data sekolah...")
    df = pd.read_csv('data/sekolah_lengkap_final.csv')
    
    index_data = []
    
    # 1. Tambahkan Sekolah
    for _, row in df.iterrows():
        lat = row.get('latitude')
        lng = row.get('longitude')
        
        # Skip if coordinates are missing or invalid
        if pd.isna(lat) or pd.isna(lng) or lat == 0 or lng == 0:
            continue
            
        try:
            lat = float(lat)
            lng = float(lng)
        except:
            continue
            
        nama = str(row.get('nama_sekolah', '')).strip()
        kab = str(row.get('kabupaten', '')).strip()
        kec = str(row.get('kecamatan', '')).strip()
        jenjang = str(row.get('jenjang', '')).strip()
        
        if not nama:
            continue
            
        index_data.append({
            "n": nama,
            "k": kab,
            "c": kec,
            "t": jenjang,
            "lt": round(lat, 6),
            "lg": round(lng, 6)
        })
        
    print(f"Total sekolah valid: {len(index_data)}")
    
    # 2. Tambahkan Kampus
    print("Membaca data kampus...")
    try:
        with open('public/data/geojson/perguruan_tinggi/kampus_data.geojson', 'r', encoding='utf-8') as f:
            kampus_geojson = json.load(f)
            
        kampus_count = 0
        for feature in kampus_geojson.get('features', []):
            props = feature.get('properties', {})
            geom = feature.get('geometry', {})
            coords = geom.get('coordinates', [])
            
            if not coords or len(coords) < 2:
                continue
                
            lng, lat = coords[0], coords[1]
            nama = props.get('Nama Perguruan Tinggi Negeri') or props.get('Nama Perguruan Tinggi') or props.get('Nama') or ''
            kab = props.get('Kabupaten/Kota', '')
            kec = props.get('Kecamatan', '')
            
            if not nama:
                continue
                
            index_data.append({
                "n": nama.strip(),
                "k": kab.strip(),
                "c": kec.strip(),
                "t": "PT",
                "lt": round(float(lat), 6),
                "lg": round(float(lng), 6)
            })
            kampus_count += 1
        print(f"Total kampus valid: {kampus_count}")
    except Exception as e:
        print("Gagal membaca kampus_data.geojson:", e)
        
    # Simpan ke file
    out_file = 'public/data/search_index.json'
    print(f"Menyimpan ke {out_file}...")
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, separators=(',', ':'))
        
    print("Selesai!")

if __name__ == "__main__":
    build_index()
