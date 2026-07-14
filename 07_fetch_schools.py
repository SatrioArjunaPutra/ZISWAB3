import requests
from bs4 import BeautifulSoup
import json
import urllib3
import re
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_links(url, prefix):
    print(f"Fetching {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    }
    r = requests.get(url, headers=headers, verify=False)
    soup = BeautifulSoup(r.text, 'html.parser')
    
    links = []
    # Find all anchor tags that match the pattern
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith(prefix) and len(href) > len(prefix):
            links.append((a.text.strip(), href))
            
    # filter unique links
    unique_links = []
    seen = set()
    for name, href in links:
        if href not in seen:
            seen.add(href)
            unique_links.append((name, href))
            
    return unique_links

def main():
    # 026000 is Kota Bandung
    base_url = "https://referensi.data.kemendikdasmen.go.id"
    start_url = base_url + "/pendidikan/dikdas/026000/2"
    
    # Let's just print the kecamatan links first
    kecamatan_links = get_links(start_url, base_url + "/pendidikan/dikdas/0260")
    print(f"Found {len(kecamatan_links)} kecamatan links")
    for name, href in kecamatan_links[:3]: # print first 3
        print(f"- {name}: {href}")
        
    if kecamatan_links:
        # Fetch one kecamatan to see its structure
        test_kec_name, test_kec_href = kecamatan_links[0]
        print(f"\nFetching Kecamatan: {test_kec_name}")
        desa_or_school_links = get_links(test_kec_href, base_url + "/pendidikan/dikdas/0260")
        print(f"Found {len(desa_or_school_links)} links inside kecamatan")
        for n, h in desa_or_school_links[:10]:
            print(f"  - {n}: {h}")

if __name__ == "__main__":
    main()
