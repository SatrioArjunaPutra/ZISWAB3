import urllib.request

url = 'https://kemenag-sooty.vercel.app/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    with open('kemenag_raw.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Fetched HTML, length:', len(html))
except Exception as e:
    print('Error:', e)
