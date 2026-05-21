# Savdogar External Partner Integration Guide (Travel Agency Startup)

This guide documents how the Travel Agency startup can integrate their backend with the Savdogar platform. 

Whenever a tour provider is approved by the superadmin, or a tour package is purchased, the Travel Agency's system should trigger HTTP POST calls to the Savdogar API.

---

## 1. Store Registration API

When the superadmin of the Travel Agency approves a tour provider, the Travel Agency backend must register a corresponding store on Savdogar.

* **Endpoint**: `POST /api/integrations/partner/store/`
* **Headers**:
  * `Content-Type: application/json`
  * `X-Partner-API-Key: savdogar_travel_agency_partner_token_2026`
* **Request Body**:
  ```json
  {
    "name": "Tour Agency Name",
    "slug": "tour-agency-slug", 
    "owner_email": "owner@agency.com",
    "description": "Optional description of the tour agency"
  }
  ```
  *(If `slug` is not provided, it will be automatically generated from the name. If the owner_email user doesn't exist, a new merchant user is automatically created).*
* **Success Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Store created and approved successfully.",
    "store_id": 15,
    "store_slug": "tour-agency-slug",
    "store_api_key": "sdk_a7b8c9d0...",
    "owner_credentials": {
      "username": "owner",
      "email": "owner@agency.com",
      "password": "random_generated_password"
    }
  }
  ```

> [!IMPORTANT]
> Keep the returned `store_api_key` saved in your database associated with this tour agency. You will need it to record sales for this specific agency.

---

## 2. Sale Recording API

Whenever a customer successfully purchases a tour package on the Travel Agency platform, the Travel Agency backend must notify Savdogar to log the sale. This will automatically populate the store's charts and reports.

* **Endpoint**: `POST /api/integrations/partner/sale/`
* **Headers**:
  * `Content-Type: application/json`
  * `X-Store-API-Key: <STORE_API_KEY>` (The unique API key obtained during store creation)
* **Request Body**:
  ```json
  {
    "buyer_name": "John Doe",
    "buyer_phone": "+998901234567",
    "buyer_email": "john@gmail.com",
    "package_name": "Paris Tour - 7 Days",
    "amount": "12500000.00",
    "quantity": 1
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Sale recorded successfully.",
    "order_id": 85,
    "order_number": "ORD-00085",
    "total": 12500000.00
  }
  ```

---

## Code Snippets for Integration (VS Code Copy-Paste)

### Python (using `requests`)

```python
import requests

SAVDOGAR_BASE_URL = "https://savdogar-api.up.railway.app" # Replace with your production domain

# 1. Register and Approve a Store on Savdogar
def register_store_on_savdogar(agency_name, agency_slug, owner_email, description=""):
    url = f"{SAVDOGAR_BASE_URL}/api/integrations/partner/store/"
    headers = {
        "Content-Type": "application/json",
        "X-Partner-API-Key": "savdogar_travel_agency_partner_token_2026"
    }
    payload = {
        "name": agency_name,
        "slug": agency_slug,
        "owner_email": owner_email,
        "description": description
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 201:
        data = response.json()
        print("Store registered successfully!")
        print(f"Store API Key: {data['store_api_key']}")
        return data["store_api_key"]
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

# 2. Record a Tour Package Sale
def record_sale_on_savdogar(store_api_key, buyer_name, buyer_phone, package_name, amount, quantity=1):
    url = f"{SAVDOGAR_BASE_URL}/api/integrations/partner/sale/"
    headers = {
        "Content-Type": "application/json",
        "X-Store-API-Key": store_api_key
    }
    payload = {
        "buyer_name": buyer_name,
        "buyer_phone": buyer_phone,
        "package_name": package_name,
        "amount": str(amount),
        "quantity": quantity
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 201:
        data = response.json()
        print(f"Sale recorded successfully! Order Number: {data['order_number']}")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None
```

### JavaScript / Node.js (using `axios`)

```javascript
const axios = require('axios');

const SAVDOGAR_BASE_URL = "https://savdogar-api.up.railway.app"; // Replace with your production domain

// 1. Register and Approve a Store on Savdogar
async function registerStoreOnSavdogar(agencyName, agencySlug, ownerEmail, description = "") {
  try {
    const response = await axios.post(`${SAVDOGAR_BASE_URL}/api/integrations/partner/store/`, {
      name: agencyName,
      slug: agencySlug,
      owner_email: ownerEmail,
      description: description
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-API-Key': 'savdogar_travel_agency_partner_token_2026'
      }
    });

    console.log("Store registered successfully!");
    console.log("Store API Key:", response.data.store_api_key);
    return response.data.store_api_key;
  } catch (error) {
    console.error("Error registering store:", error.response ? error.response.data : error.message);
    return null;
  }
}

// 2. Record a Tour Package Sale
async function recordSaleOnSavdogar(storeApiKey, buyerName, buyerPhone, packageName, amount, quantity = 1) {
  try {
    const response = await axios.post(`${SAVDOGAR_BASE_URL}/api/integrations/partner/sale/`, {
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      package_name: packageName,
      amount: String(amount),
      quantity: quantity
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Store-API-Key': storeApiKey
      }
    });

    console.log(`Sale recorded successfully! Order Number: ${response.data.order_number}`);
    return response.data;
  } catch (error) {
    console.error("Error recording sale:", error.response ? error.response.data : error.message);
    return null;
  }
}
```
