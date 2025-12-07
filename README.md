# FinBoard - Customizable Finance Dashboard

FinBoard is a real-time, customizable finance dashboard builder. It allows users to monitor financial data (stocks, crypto, etc.) by connecting seamlessly to various financial APIs. Users can construct their own dashboard layouts using a drag-and-drop interface, configuring widgets to display live data in the form of tables, cards, and charts.

##  Key Features

### Dynamic Widget Management

- **Create Custom Widgets**: Users can add new widgets by inputting API URLs and configuring refresh intervals.
- **Multiple Visualization Types**: Support for Finance Cards (Watchlists, Market Gainers), Data Tables with filtering, and Charts (Candle/Line graphs).
- **Drag-and-Drop Layout**: A flexible grid system allowing users to rearrange widget positions easily.

### Advanced API Integration

- **Dynamic Data Mapping**: Includes an interactive JSON explorer that allows users to parse API responses and select specific fields to display without code changes.
- **Real-Time Updates**: Automatic data fetching based on user-configurable time intervals.

### Persistence & State Management

- **Session Storage**: Dashboard layouts and widget configurations are saved to browser storage, ensuring the dashboard state is restored upon page refreshes or browser restarts.
- **Config Management**: Capabilities to export and import dashboard configurations.

##  Tech Stack

- **Frontend**: Next.js
- **Styling**: Tailwind CSS / Styled-Components
- **State Management**:Zustand 
- **Visualization**:  Recharts
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finboard
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

The page auto-updates as you edit the files.

## Usage

Once the application is running, you can:

1. **Add Widgets**: Use the widget adder to create new widgets by providing API URLs and configuration options.
2. **Customize Layout**: Drag and drop widgets to rearrange your dashboard layout.
3. **Configure Data**: Use the JSON explorer to map API response fields to widget displays.
4. **Monitor Data**: Watch real-time updates as your configured widgets fetch and display live financial data.
