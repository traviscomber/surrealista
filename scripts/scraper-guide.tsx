"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ScraperGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Website Data Extraction Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          To extract data from sur-realista.cl, you'll need to run a web scraper. Below are instructions for different
          methods.
        </p>

        <Tabs defaultValue="browser">
          <TabsList className="mb-4">
            <TabsTrigger value="browser">Browser Method</TabsTrigger>
            <TabsTrigger value="nodejs">Node.js Script</TabsTrigger>
            <TabsTrigger value="python">Python Script</TabsTrigger>
          </TabsList>

          <TabsContent value="browser">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Using Browser Developer Tools</h3>

              <ol className="list-decimal pl-5 space-y-2">
                <li>Open sur-realista.cl in Chrome or Firefox</li>
                <li>Right-click on a property listing and select "Inspect" or press F12</li>
                <li>In the Console tab, paste the following JavaScript code:</li>
              </ol>

              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {`// This script extracts property data from the current page
const properties = [];

// Select all property cards/containers (adjust the selector as needed)
document.querySelectorAll('.property-card').forEach(card => {
  const property = {
    title: card.querySelector('.property-title')?.textContent?.trim(),
    price: card.querySelector('.property-price')?.textContent?.trim(),
    location: card.querySelector('.property-location')?.textContent?.trim(),
    description: card.querySelector('.property-description')?.textContent?.trim(),
    bedrooms: parseInt(card.querySelector('.property-bedrooms')?.textContent?.trim() || '0'),
    bathrooms: parseInt(card.querySelector('.property-bathrooms')?.textContent?.trim() || '0'),
    area: parseInt(card.querySelector('.property-area')?.textContent?.trim() || '0'),
    images: Array.from(card.querySelectorAll('.property-image')).map(img => ({
      url: img.getAttribute('src'),
      is_main: img.classList.contains('main-image')
    }))
  };
  
  properties.push(property);
});

// Copy the data to clipboard as JSON
copy(JSON.stringify(properties, null, 2));
console.log('Property data copied to clipboard!');
console.log(\`Extracted \${properties.length} properties\`);`}
              </pre>

              <p>
                This will copy the extracted data to your clipboard. You can then paste it into a JSON file and use the
                Import tool.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="nodejs">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Using Node.js with Puppeteer</h3>

              <p>Create a new Node.js project and install Puppeteer:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {`npm init -y
npm install puppeteer fs`}
              </pre>

              <p>Create a file named scraper.js:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {`const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Launch browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to website
  await page.goto('https://www.sur-realista.cl/propiedades', { waitUntil: 'networkidle2' });
  
  // Extract property data
  const properties = await page.evaluate(() => {
    const results = [];
    
    // Select all property cards (adjust selector as needed)
    document.querySelectorAll('.property-card').forEach(card => {
      const property = {
        title: card.querySelector('.property-title')?.textContent?.trim(),
        price: parseFloat(card.querySelector('.property-price')?.textContent?.trim().replace(/[^0-9]/g, '')),
        location: card.querySelector('.property-location')?.textContent?.trim(),
        description: card.querySelector('.property-description')?.textContent?.trim(),
        bedrooms: parseInt(card.querySelector('.property-bedrooms')?.textContent?.trim() || '0'),
        bathrooms: parseInt(card.querySelector('.property-bathrooms')?.textContent?.trim() || '0'),
        area: parseInt(card.querySelector('.property-area')?.textContent?.trim() || '0'),
        property_type: card.querySelector('.property-type')?.textContent?.trim().toLowerCase(),
        status: 'available',
        featured: card.classList.contains('featured'),
        images: Array.from(card.querySelectorAll('.property-image')).map(img => ({
          url: img.getAttribute('src'),
          is_main: img.classList.contains('main-image')
        }))
      };
      
      results.push(property);
    });
    
    return results;
  });
  
  // Save to file
  fs.writeFileSync('properties.json', JSON.stringify(properties, null, 2));
  console.log(\`Extracted \${properties.length} properties and saved to properties.json\`);
  
  await browser.close();
})();`}
              </pre>

              <p>Run the script with:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{`node scraper.js`}</pre>
            </div>
          </TabsContent>

          <TabsContent value="python">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Using Python with BeautifulSoup</h3>

              <p>Install required packages:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {`pip install requests beautifulsoup4`}
              </pre>

              <p>Create a file named scraper.py:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
                {`import requests
import json
from bs4 import BeautifulSoup

# Send request to website
url = 'https://www.sur-realista.cl/propiedades'
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# Extract property data
properties = []

# Find all property cards (adjust selector as needed)
property_cards = soup.select('.property-card')

for card in property_cards:
    # Extract data from each card
    title = card.select_one('.property-title').text.strip() if card.select_one('.property-title') else None
    price_elem = card.select_one('.property-price')
    price = int(price_elem.text.strip().replace('.', '').replace('$', '')) if price_elem else None
    location = card.select_one('.property-location').text.strip() if card.select_one('.property-location') else None
    description = card.select_one('.property-description').text.strip() if card.select_one('.property-description') else None
    
    # Extract features
    bedrooms_elem = card.select_one('.property-bedrooms')
    bedrooms = int(bedrooms_elem.text.strip()) if bedrooms_elem else 0
    
    bathrooms_elem = card.select_one('.property-bathrooms')
    bathrooms = int(bathrooms_elem.text.strip()) if bathrooms_elem else 0
    
    area_elem = card.select_one('.property-area')
    area = int(area_elem.text.strip().replace('m²', '')) if area_elem else 0
    
    # Extract images
    images = []
    image_elements = card.select('.property-image')
    for img in image_elements:
        images.append({
            'url': img['src'],
            'is_main': 'main-image' in img.get('class', [])
        })
    
    # Create property object
    property_data = {
        'title': title,
        'price': price,
        'location': location,
        'description': description,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'area': area,
        'property_type': card.select_one('.property-type').text.strip().lower() if card.select_one('.property-type') else 'house',
        'status': 'available',
        'featured': 'featured' in card.get('class', []),
        'images': images
    }
    
    properties.append(property_data)

# Save to file
with open('properties.json', 'w', encoding='utf-8') as f:
    json.dump(properties, f, ensure_ascii=False, indent=2)

print(f'Extracted {len(properties)} properties and saved to properties.json')`}
              </pre>

              <p>Run the script with:</p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{`python scraper.py`}</pre>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-md">
          <p className="font-semibold">Important Notes:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>
              The selectors in these scripts (.property-card, .property-title, etc.) need to be adjusted based on the
              actual HTML structure of sur-realista.cl
            </li>
            <li>Web scraping may be against the website's terms of service. Always check before scraping.</li>
            <li>Consider reaching out to the website owners for an official data export if possible.</li>
            <li>These scripts are for educational purposes only.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
