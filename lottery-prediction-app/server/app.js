import express from 'express';
import cors from 'cors';
import { dbHelper } from './db/setup.js';
import {
  randomPrediction,
  mlPrediction,
  neuralNetworkPrediction,
  savePrediction,
  calculateAccuracy,
  detectPatterns
} from './models/predictionModel.js';
import { generateDemoResponse } from './services/chatbotService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes

// Store past lottery results
app.post('/api/store', async (req, res) => {
  try {
    const { numbers, bonusNumber } = req.body;

    // Validate input
    if (!numbers || !bonusNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Parse numbers if they're provided as a string
    const parsedNumbers = typeof numbers === 'string'
      ? numbers.split(',').map(n => parseInt(n.trim()))
      : numbers;

    // Validate numbers format
    if (!Array.isArray(parsedNumbers) || parsedNumbers.length !== 7) {
      return res.status(400).json({ error: 'Numbers must be an array of 7 integers' });
    }

    // Convert numbers to a string for storage
    const numbersStr = parsedNumbers.join(',');

    // Insert into database
    const result = await dbHelper.run(
      'INSERT INTO past_results (numbers, bonus_number) VALUES (?, ?)',
      [numbersStr, bonusNumber]
    );

    // After storing, detect new patterns
    await detectPatterns();

    // Return success response
    res.json({
      success: true,
      id: result.lastID,
      message: 'Past lottery result saved successfully'
    });
  } catch (error) {
    console.error('Error storing past result:', error);
    res.status(500).json({ error: 'Failed to store past result' });
  }
});

// Get all past lottery results
app.get('/api/past-results', async (req, res) => {
  try {
    const results = await dbHelper.all('SELECT * FROM past_results ORDER BY id DESC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching past results:', error);
    res.status(500).json({ error: 'Failed to fetch past results' });
  }
});

// Generate a prediction using the specified model
app.get('/api/predict', async (req, res) => {
  try {
    const { model = 'neural' } = req.query;

    let prediction;
    let source;

    switch (model) {
      case 'random':
        prediction = randomPrediction();
        source = 'random';
        break;
      case 'ml':
        prediction = await mlPrediction();
        source = 'machine_learning';
        break;
      case 'neural':
      default:
        prediction = await neuralNetworkPrediction();
        source = 'neural_network';
        break;
    }

    // Save the prediction to the database
    await savePrediction(
      prediction.numbers,
      prediction.bonusNumber,
      source
    );

    res.json({
      prediction: {
        numbers: prediction.numbers,
        bonusNumber: prediction.bonusNumber,
        source,
        date: new Date().toISOString()
      },
      message: 'Prediction generated successfully'
    });
  } catch (error) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Get all predictions
app.get('/api/predictions', async (req, res) => {
  try {
    const predictions = await dbHelper.all('SELECT * FROM predictions ORDER BY id DESC');
    res.json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// Calculate and get prediction accuracy
app.get('/api/accuracy', async (req, res) => {
  try {
    const accuracy = await calculateAccuracy();
    res.json(accuracy);
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    res.status(500).json({ error: 'Failed to calculate accuracy' });
  }
});

// Get pattern analysis
app.get('/api/patterns', async (req, res) => {
  try {
    const patterns = await dbHelper.all('SELECT * FROM detected_patterns ORDER BY id DESC');
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use the demo response for now
    const response = await generateDemoResponse(message);

    res.json({ response });
  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
