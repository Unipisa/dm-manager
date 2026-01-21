import requests
from bs4 import BeautifulSoup
import json
import re

# Example script (generated with ChatGPT) to generate a valid input JSON for upload-documents.js

URL = "https://www.dm.unipi.it/organizzazione/commissioni/attivita-commissione-paritetica/"

resp = requests.get(URL)
soup = BeautifulSoup(resp.text, "html.parser")

docs = []

for a in soup.select("a"):
    txt = a.get_text(strip=True)
    # consideriamo solo sedute, non "Relazione annuale"
    m = re.match(r"Seduta del (\d{1,2}-\d{2}-\d{4})", txt)
    if m:
        date_raw = m.group(1)
        # converti in formato YYYY-MM-DD
        d, mth, y = date_raw.split("-")
        date_iso = f"{y}-{mth}-{d.zfill(2)}"
        href = a.get("href")
        if href:
            if href.startswith("/"):
                href = "https://www.dm.unipi.it" + href
            docs.append({
                "name": "Verbale della Commissione Paritetica",
                "date": date_iso,
                "attachments": [
                    {"url": href}
                ],
                "access_codes": [ "pubblico" ],
                "owners": []
            })

output = {"documents": docs}

print(json.dumps(output, indent=2, ensure_ascii=False))
