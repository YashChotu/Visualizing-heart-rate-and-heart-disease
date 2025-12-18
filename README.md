# Heart Rate & Disease Visualization Dashboard

An interactive web application for visualizing heart rate data and cardiovascular disease risk analysis.

## Features

### Core Features
- 📊 Interactive charts and graphs (4 visualization types)
- 💓 Heart rate distribution analysis
- 📈 Age-based risk assessment
- ⏰ Time-series heart rate monitoring
- 📋 Patient data table with risk categorization
- 🎨 Modern, responsive design

### NEW Advanced Features ✨
- 🌙 **Dark Mode** - Toggle between light/dark themes
- 📊 **Export to CSV** - Download complete dataset
- 📄 **Export to PDF** - Generate comprehensive reports
- 🔴 **Real-time Monitor** - Live heart rate simulation with alerts
- 🔍 **Search & Filter** - Advanced filtering by risk level and age
- 👤 **Patient Details** - View detailed patient information
- 📈 **Data Comparison** - Compare current vs previous datasets
- ⚠️ **Alert System** - Automatic high-risk notifications

## Demo

Open `index.html` in your browser to view the dashboard.

## Technologies Used

- HTML5
- CSS3 (with modern gradients and animations)
- JavaScript (ES6+)
- Chart.js for data visualization

## Deployment Options

### Option 1: GitHub Pages

1. Push this project to a GitHub repository
2. Go to Settings > Pages
3. Select the main branch as source
4. Your site will be available at `https://username.github.io/repository-name`

### Option 2: Netlify

1. Sign up at [Netlify](https://www.netlify.com)
2. Drag and drop the project folder to Netlify
3. Your site will be deployed instantly with a custom URL

### Option 3: Vercel

1. Sign up at [Vercel](https://vercel.com)
2. Import the project from GitHub or upload directly
3. Deploy with zero configuration

### Option 4: Local Server

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
├── index.html      # Main HTML file
├── styles.css      # Styling and layout
├── script.js       # JavaScript logic and Chart.js implementation
└── README.md       # This file
```

## Data

The dashboard generates random synthetic patient data for demonstration purposes. In a real-world scenario, this would connect to a backend API or database with actual patient data.

## License

MIT License - Feel free to use this project for educational purposes.
