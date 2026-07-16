import os
import time
import re
import pandas as pd
from playwright.sync_api import sync_playwright

INPUT_CSV = "data/sekolah_lengkap_final.csv"
OUTPUT_LOG = "data/log_koordinat_gmaps.csv"

def extract_coords_from_url(url):
    match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url)
    if match:
        return match.group(1), match.group(2)
    return None, None

def main():
    df = pd.read_csv(INPUT_CSV, dtype=str)
    sudah_ada = {}
    if os.path.exists(OUTPUT_LOG):
        df_log = pd.read_csv(OUTPUT_LOG, dtype=str)
        for _, row in df_log.iterrows():
            if pd.notna(row['latitude']) and str(row['latitude']).strip() != "":
                sudah_ada[row['npsn']] = (row['latitude'], row['longitude'])
            
    missing_df = df[df['latitude'].isna() & df['longitude'].isna()]
    npsn_list = missing_df['npsn'].tolist()
    npsn_belum = [n for n in npsn_list if n not in sudah_ada]
    
    print(f"Total koordinat kosong (dari Kemendikbud): {len(missing_df)}.")
    print(f"Sisa yang belum dicoba dicari di Google Maps: {len(npsn_belum)}")
    
    if len(npsn_belum) == 0:
        print("Semua data sudah selesai diproses.")
        return
        
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        tulis_header = not os.path.exists(OUTPUT_LOG) or os.path.getsize(OUTPUT_LOG) == 0
        with open(OUTPUT_LOG, "a", encoding="utf-8") as f:
            if tulis_header:
                f.write("npsn,latitude,longitude\n")
            
            for i, npsn in enumerate(npsn_belum):
                if page.is_closed():
                    print("\n[!] Browser telah ditutup! Menghentikan script sepenuhnya.")
                    break

                row = missing_df[missing_df['npsn'] == npsn].iloc[0]
                search_query = f"{row['nama_sekolah']} {row['kecamatan']} {row['kabupaten']}"
                print(f"[{i+1}/{len(npsn_belum)}] Mencari: {search_query} ...")
                
                try:
                    page.goto("https://www.google.com/maps?hl=id")
                    
                    try:
                        page.wait_for_selector("input#searchboxinput", timeout=10000)
                    except Exception:
                        if page.is_closed():
                            print("\n[!] Browser ditutup oleh pengguna.")
                            break
                        print("\n[!] PERHATIAN: Kolom pencarian Maps tidak ditemukan.")
                        print("[!] JANGAN TUTUP BROWSERNYA! Jika ada tombol 'Setuju' / 'Accept' atau 'Saya bukan robot', mohon diklik.")
                        print("[!] Script sedang menunggu (maks 5 menit) sampai halaman Maps muncul...\n")
                        page.wait_for_selector("input#searchboxinput", timeout=300000)
                        print("[*] Berhasil memuat Maps! Melanjutkan...\n")
                    
                    page.fill("input#searchboxinput", search_query)
                    page.press("input#searchboxinput", "Enter")
                    
                    lat, lon = "", ""
                    try:
                        page.wait_for_url(lambda url: "@" in url and ("place" in url or "dir" in url), timeout=10000)
                        time.sleep(1)
                        lat, lon = extract_coords_from_url(page.url)
                        if not lat:
                            lat, lon = "", ""
                    except Exception:
                        pass
                        
                    if lat and lon:
                        print(f"  -> Ditemukan: {lat}, {lon}")
                    else:
                        print(f"  -> Tidak ditemukan koordinat di URL (Mungkin lokasi tak terdaftar)")
                    
                    f.write(f"{npsn},{lat},{lon}\n")
                    f.flush()
                    time.sleep(2)
                    
                except Exception as e:
                    if page.is_closed():
                        print("\n[!] Browser telah ditutup! Menghentikan script sepenuhnya.")
                        break
                    print(f"  -> Error: Halaman diblokir secara permanen atau jaringan terputus. Coba lagi.")
                    time.sleep(5)
                    
        if not browser.is_connected():
            browser.close()
        
if __name__ == "__main__":
    main()
