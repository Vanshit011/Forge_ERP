# ⚙️ Forge_ERP - Smart Forging Industry Management System

Forge_ERP is an end-to-end ERP solution built for **metal forging industries**, focused on **Incoming Stock, Cutting (Sharing & Secular), Forging, and Outgoing Stock** — all updated in **real-time** with **Socket.io live sync**.

---

## 🚀 Key Features

### 🧾 Incoming Stock Management
Track all materials entering your plant.

**Fields include:**
- Date  
- Party Name  
- Material Type (SS, MS, etc.)  
- Color Code  
- Diameter / Size  
- Quantity (Kg and Nos)  
- Heat No.  
- TC Report  
- Part Name  
- Remarks  

**Functions:**
- Add or view your own material stock.
- Auto-update when cutting or forging consumes material.
- Live socket updates to frontend dashboard.

---

### ✂️ Cutting Management
Two types of cutting supported — **Sharing** and **Secular**.

**Fields:**
- Incoming Stock Reference (material, color, dia, etc.)
- Cutting Weight (e.g., 0.495 kg)
- Weight Variant (e.g., 0.010 kg)
- End Pcs Weight (e.g., 0.010 kg)
- Blend (for Secular cutting, e.g., 2mm)
- Bhuki/Waste (auto-calculated)

**Auto Calculations:**
- Final Cut Weight = Cutting Weight + Weight Variant + End Pcs Weight  
- Total Pcs Cut = (Total Stock Weight ÷ Final Cut Weight)
- Total Waste (Bhuki) = Stock Weight − (Total Pcs × Final Cut Weight)
- Updates stock balance automatically in incoming stock.

**Real-time socket events:**
- When new cutting is added → Dashboard updates instantly.

---

### 🔨 Forging Management
Convert cut pieces into forged components.

**Fields:**
- Linked Cutting Entry (auto fetched)
- Material & Color Code
- Forging Type (Hammer / Press / Die)
- Forging Weight per Pcs (in Kg)
- Total Pcs Forged
- Bhuki/Waste during Forging (auto-calculated)
- Worker / Machine used

**Auto Calculations:**
- Total Forged Weight = (Forging Weight × Total Pcs)
- Total Waste = (Input Weight − Total Forged Weight)
- Updates Cutting & Stock data live
- Supports cost tracking for job work or own material

**Socket Updates:**  
All users see live forging updates on dashboard.

---

### 📦 Outgoing Stock (Final Dispatch)
After forging and finishing, the ready components are dispatched.

**Fields:**
- Party Name
- Part Name
- Quantity (Nos/Kg)
- Dispatch Date
- Vehicle/Invoice Details
- Remarks

**System Logic:**
- Automatically deducts from final pcs/forged items
- Shows available vs. dispatched stock
- Generates outgoing summary report

---

### 📊 Live Dashboard Overview
One centralized dashboard showing:
- Total Incoming Material (Kg)
- Total Used in Cutting (Kg)
- Total Forged Weight
- Remaining Raw Stock
- Outgoing Dispatch Weight
- Waste (Bhuki) per Process
- Real-Time Stock Movement Chart (via Socket.io)

---

## 💰 Cost Estimation Engine
The system calculates estimated production cost for every step:

| Process | Factors Considered | Output |
|----------|-------------------|---------|
| Cutting | Material cost/kg, Bhuki % | Cost per cut |
| Forging | Energy + Labor + Tool cost | Cost per forged pcs |
| Outgoing | Packing + Transport | Total dispatch cost |

Supports **own material** and **job work** pricing modes.

---

## 🧠 Future Modules (Upcoming)
- Party-wise material and cost reports  
- Daily production analytics  
- Forging machine performance chart  
- Worker productivity tracking  
- Maintenance & tool life module  
- Quality & inspection reports  

---

## 🛠️ Tech Stack

### Frontend
- ⚛️ React.js (Vite)
- 🎨 Tailwind CSS + Shadcn UI
- 🔄 Socket.io Client
- 📊 Chart.js (for live production dashboard)

### Backend
- 🟢 Node.js + Express.js
- 💾 MongoDB (Mongoose ODM)
- 🔌 Socket.io Server (real-time sync)
- 🧰 REST APIs + Validation
- 🧮 Real-time calculation engine
