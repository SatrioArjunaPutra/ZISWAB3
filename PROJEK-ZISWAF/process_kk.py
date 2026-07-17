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
    # Agama
    agama_cols = ['islam', 'kristen', 'katholik', 'hindu', 'budha', 'konghucu', 'kepercayaan']
    for col in agama_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Umur
    umur_cols = ['u0', 'u5', 'u10', 'u15', 'u20', 'u25', 'u30', 'u35', 'u40', 'u45', 'u50', 'u55', 'u60', 'u65', 'u70', 'u75']
    for col in umur_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    df['anak'] = df['u0'] + df['u5'] + df['u10']
    df['produktif'] = df['u15'] + df['u20'] + df['u25'] + df['u30'] + df['u35'] + df['u40'] + df['u45'] + df['u50'] + df['u55'] + df['u60']
    df['lansia'] = df['u65'] + df['u70'] + df['u75']

    cols_to_sum = ['jumlah_kk', 'pria', 'wanita', 'anak', 'produktif', 'lansia'] + agama_cols
    
    # aggregate to Desa level
    desa_data = df.groupby(['nama_kab', 'nama_kec', 'nama_kel'])[cols_to_sum].sum().reset_index()
    
    result = {}
    for _, row in desa_data.iterrows():
        kab = row['nama_kab']
        kec = row['nama_kec']
        desa = row['nama_kel']
        
        if kab not in result:
            result[kab] = {}
        if kec not in result[kab]:
            result[kab][kec] = {}
            
        result[kab][kec][desa] = {
            "jumlah_kk": int(row['jumlah_kk']),
            "pria": int(row['pria']),
            "wanita": int(row['wanita']),
            "umur": {
                "anak": int(row['anak']),
                "produktif": int(row['produktif']),
                "lansia": int(row['lansia'])
            },
            "agama": {
                "islam": int(row['islam']),
                "kristen": int(row['kristen']),
                "katholik": int(row['katholik']),
                "hindu": int(row['hindu']),
                "budha": int(row['budha']),
                "konghucu": int(row['konghucu']),
                "kepercayaan": int(row['kepercayaan'])
            }
        }
        
    with open('public/data/jumlah_kk.json', 'w') as f:
        json.dump(result, f, indent=2)
        
    print("Successfully processed data_kepala_keluarga_desa_jabar.csv and created public/data/jumlah_kk.json")

if __name__ == "__main__":
    process_data()
