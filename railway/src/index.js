import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { default as WhatsAppConnection } from './whatsapp/connection.js';
import { config } from 'dotenv';
import pino from 'pino';

// Load environment variables
config();

const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
});

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active connections
const connections = new Map();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Initialize WhatsApp connection
app.post('/init', async (req, res) => {
  try {
    const { connectionId } = req.body;
    
    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID is required' });
    }

    // Check if connection already exists
    if (connections.has(connectionId)) {
      return res.status(400).json({ error: 'Connection already exists' });
    }

    // Create new WhatsApp connection
    const connection = new WhatsAppConnection(connectionId, supabase, logger);
    connections.set(connectionId, connection);

    // Initialize connection
    await connection.initialize();

    res.json({ status: 'initializing' });
  } catch (error) {
    logger.error(error, 'Failed to initialize WhatsApp connection');
    res.status(500).json({ error: 'Failed to initialize connection' });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});