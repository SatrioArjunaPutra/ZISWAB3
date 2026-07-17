import pandas as pd
import json

def process_data():
    df = pd.read_csv('public/data/data_kepala_keluarga_desa_jabar.csv')
    
    # We want to make a lookup for Kabupaten, Kecamatan, and Desa
    # Let's create a nested dictionary: {kabupaten: {kecamatan: {desa: jumlah_kk}}}
    
    # Clean up names: uppercase for matching with GeoJSON
    df['nama_kab'] = df['nama_kab'].str.upper()
    df['nama_kab'] = df['nama_kab'].str.replace('KAB.', 'KABUPATEN', regex=False)
    df['nama_kec'] = df['nama_kec'].str.upper()
    df['nama_kel'] = df['nama_kel'].str.upper()
    
    # ensure numeric columns
    df['jumlah_kk'] = pd.to_numeric(df['jumlah_kk'], errors='coerce').fillna(0)
    df['pria'] = pd.to_numeric(df['pria'], errors='coerce').fillna(0)
    df['wanita'] = pd.to_numeric(df['wanita'], errors='coerce').fillna(0)
    
    # aggregate to Desa level
    desa_data = df.groupby(['nama_kab', 'nama_kec', 'nama_kel'])[['jumlah_kk', 'pria', 'wanita']].sum().reset_index()
    
    result = {}
    for _, row in desa_data.iterrows():
        kab = row['nama_kab']
        kec = row['nama_kec']
        desa = row['nama_kel']
        kk = int(row['jumlah_kk'])
        pria = int(row['pria'])
        wanita = int(row['wanita'])
        
        if kab not in result:
            result[kab] = {}
        if kec not in result[kab]:
            result[kab][kec] = {}
            
        result[kab][kec][desa] = {
            "jumlah_kk": kk,
            "pria": pria,
            "wanita": wanita
        }
        
    with open('public/data/jumlah_kk.json', 'w') as f:
        json.dump(result, f, indent=2)
        
    print("Successfully processed data_kepala_keluarga_desa_jabar.csv and created public/data/jumlah_kk.json")

if __name__ == "__main__":
    process_data()
