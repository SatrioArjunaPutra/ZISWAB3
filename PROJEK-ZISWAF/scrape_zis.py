import urllib.request
import re

url = 'https://kemenag-sooty.vercel.app/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

# The RSC payload has the data in a specific structure. Let's find any large JSON-like string
matches = re.findall(r'(\[.*?Kota Bandung.*?\])', html, re.IGNORECASE)
for i, m in enumerate(matches):
    try:
        # Try to parse JSON from Next.js payload, it's messy so we just save it as text to inspect
        with open(f'scrape_match_{i}.txt', 'w', encoding='utf-8') as f:
            f.write(m)
    except:
        pass
