import express from 'express';
import cors from 'cors';
import { routeHandler } from './routes/routeHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/route', routeHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flight Seat Recommender API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api/route`);
}); 