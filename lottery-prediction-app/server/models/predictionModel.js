import { dbHelper } from '../db/setup.js';

// Utility functions
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateUniqueRandomNumbers = (count, min, max) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(getRandomInt(min, max));
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

// Basic random prediction
const randomPrediction = () => {
  const numbers = generateUniqueRandomNumbers(7, 1, 49);
  const bonusNumber = getRandomInt(1, 49);
  return { numbers, bonusNumber };
};

// Save prediction to database
const savePrediction = async (numbers, bonusNumber, source) => {
  const numbersStr = numbers.join(',');

  try {
    const result = await dbHelper.run(
      'INSERT INTO predictions (numbers, bonus_number, source) VALUES (?, ?, ?)',
      [numbersStr, bonusNumber, source]
    );

    return {
      id: result.lastID,
      numbers,
      bonusNumber,
      source
    };
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
};

// ML-based prediction (simulated for now)
const mlPrediction = async () => {
  try {
    // Get past results for training
    const pastResults = await dbHelper.all('SELECT * FROM past_results');

    // If we don't have enough data, fall back to random
    if (pastResults.length < 5) {
      return randomPrediction();
    }

    // Simple frequency-based prediction (a very basic ML approach)
    // Count frequency of each number
    const numberFrequency = new Array(50).fill(0); // indices 1-49 represent lottery numbers

    pastResults.forEach(result => {
      const numbers = result.numbers.split(',').map(n => parseInt(n.trim()));
      numbers.forEach(num => {
        numberFrequency[num]++;
      });
      // Also count bonus numbers
      numberFrequency[result.bonus_number]++;
    });

    // Create pairs of [number, frequency]
    const numberPairs = [];
    for (let i = 1; i <= 49; i++) {
      numberPairs.push([i, numberFrequency[i]]);
    }

    // Sort by frequency (higher frequency first)
    numberPairs.sort((a, b) => b[1] - a[1]);

    // Take top 7 most frequent numbers
    const mostFrequent = numberPairs.slice(0, 7).map(pair => pair[0]);

    // For the bonus number, take the 8th most frequent
    const bonusNumber = numberPairs[7] ? numberPairs[7][0] : getRandomInt(1, 49);

    // Add some randomness - 30% chance to replace each number with a random one
    const finalNumbers = mostFrequent.map(num => {
      return Math.random() < 0.3 ? getRandomInt(1, 49) : num;
    });

    // Ensure numbers are unique
    const uniqueNumbers = Array.from(new Set(finalNumbers));
    // If we lost some numbers due to duplicates, add random ones
    while (uniqueNumbers.length < 7) {
      const newRandom = getRandomInt(1, 49);
      if (!uniqueNumbers.includes(newRandom)) {
        uniqueNumbers.push(newRandom);
      }
    }

    return {
      numbers: uniqueNumbers.sort((a, b) => a - b),
      bonusNumber
    };
  } catch (error) {
    console.error('Error in ML prediction:', error);
    return randomPrediction(); // Fallback to random on error
  }
};

// Neural network prediction (simulated)
const neuralNetworkPrediction = async () => {
  try {
    // This is a placeholder for an actual neural network model
    // In a real implementation, this would use TensorFlow.js or a similar library
    // For now, we'll simulate a slightly more sophisticated approach than the basic ML model

    const pastResults = await dbHelper.all('SELECT * FROM past_results ORDER BY id DESC LIMIT 20');

    if (pastResults.length < 10) {
      return mlPrediction(); // Fall back to basic ML
    }

    // Analyze past patterns (more sophisticated than basic frequency)
    // Here we're simulating a neural network by adding weights and considering recent trends

    const numberWeights = new Array(50).fill(0);

    // Apply recency bias - more recent results have higher weight
    pastResults.forEach((result, index) => {
      const recencyWeight = 1 - (index / pastResults.length * 0.5); // Weight between 0.5 and 1.0
      const numbers = result.numbers.split(',').map(n => parseInt(n.trim()));

      numbers.forEach(num => {
        numberWeights[num] += recencyWeight;
      });

      // Bonus numbers get a different weight
      numberWeights[result.bonus_number] += recencyWeight * 0.5;
    });

    // Look for hot and cold numbers
    const recentResults = pastResults.slice(0, 5);
    const olderResults = pastResults.slice(5);

    const recentNumbers = new Set();
    recentResults.forEach(result => {
      result.numbers.split(',').map(n => parseInt(n.trim())).forEach(num => {
        recentNumbers.add(num);
      });
    });

    // Adjust weights based on hot/cold patterns
    for (let i = 1; i <= 49; i++) {
      if (recentNumbers.has(i)) {
        // Hot numbers get a boost (simulating our neural network learning)
        numberWeights[i] *= 1.2;
      } else {
        // Cold numbers have a smaller chance but still possible
        numberWeights[i] *= 0.8;
      }
    }

    // Create pairs of [number, weight]
    const weightedPairs = [];
    for (let i = 1; i <= 49; i++) {
      weightedPairs.push([i, numberWeights[i]]);
    }

    // Sort by weight (higher weight first)
    weightedPairs.sort((a, b) => b[1] - a[1]);

    // Select based on weights with some randomness
    const selectedNumbers = [];
    const usedIndices = new Set();

    // Select 7 unique numbers with weight bias
    while (selectedNumbers.length < 7) {
      // 70% chance to pick from top 15, 30% chance to pick randomly from the rest
      let index;
      if (Math.random() < 0.7) {
        index = Math.floor(Math.random() * 15); // Pick from top 15
      } else {
        index = 15 + Math.floor(Math.random() * (weightedPairs.length - 15)); // Pick from rest
      }

      if (!usedIndices.has(index)) {
        usedIndices.add(index);
        selectedNumbers.push(weightedPairs[index][0]);
      }
    }

    // Pick bonus number from top 10 that wasn't used in main selection
    let bonusIndex = 0;
    while (usedIndices.has(bonusIndex) && bonusIndex < 10) {
      bonusIndex++;
    }

    const bonusNumber = bonusIndex < 10 ?
      weightedPairs[bonusIndex][0] :
      getRandomInt(1, 49);

    return {
      numbers: selectedNumbers.sort((a, b) => a - b),
      bonusNumber
    };
  } catch (error) {
    console.error('Error in neural network prediction:', error);
    return mlPrediction(); // Fallback to ML on error
  }
};

// Calculate prediction accuracy based on past results
const calculateAccuracy = async () => {
  try {
    const predictions = await dbHelper.all('SELECT * FROM predictions');
    const pastResults = await dbHelper.all('SELECT * FROM past_results');

    if (predictions.length === 0 || pastResults.length === 0) {
      return { accuracy: 0, matches: 0, totalPredictions: 0 };
    }

    let totalMatches = 0;
    let totalNumbers = 0;

    // For each prediction, find a corresponding past result (by date)
    for (const prediction of predictions) {
      const predictionDate = new Date(prediction.date);
      const predictionNumbers = prediction.numbers.split(',').map(n => parseInt(n.trim()));

      // Find past results that came after this prediction
      const futureResults = pastResults.filter(result => {
        const resultDate = new Date(result.date);
        return resultDate > predictionDate;
      });

      if (futureResults.length > 0) {
        // Get the first result after the prediction
        const matchResult = futureResults.sort((a, b) => {
          return new Date(a.date) - new Date(b.date);
        })[0];

        const resultNumbers = matchResult.numbers.split(',').map(n => parseInt(n.trim()));

        // Count matching numbers
        let matches = 0;
        predictionNumbers.forEach(num => {
          if (resultNumbers.includes(num)) {
            matches++;
          }
        });

        // Check bonus number
        if (parseInt(prediction.bonus_number) === parseInt(matchResult.bonus_number)) {
          matches++;
        }

        totalMatches += matches;
        totalNumbers += 8; // 7 regular numbers + 1 bonus
      }
    }

    const accuracy = totalNumbers > 0 ? (totalMatches / totalNumbers) : 0;

    // Save accuracy to database
    await dbHelper.run(
      'INSERT INTO model_accuracy (model_name, accuracy) VALUES (?, ?)',
      ['neural_network', accuracy]
    );

    return {
      accuracy,
      matches: totalMatches,
      totalPredictions: predictions.length
    };
  } catch (error) {
    console.error('Error calculating accuracy:', error);
    return { accuracy: 0, matches: 0, totalPredictions: 0 };
  }
};

// Detect patterns in past results
const detectPatterns = async () => {
  try {
    const pastResults = await dbHelper.all('SELECT * FROM past_results');

    if (pastResults.length < 10) {
      return { patterns: [] };
    }

    const patterns = [];

    // Check for number pairs that appear together frequently
    const pairFrequency = {};

    pastResults.forEach(result => {
      const numbers = result.numbers.split(',').map(n => parseInt(n.trim()));

      // Check all possible pairs
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const pairKey = `${numbers[i]},${numbers[j]}`;
          pairFrequency[pairKey] = (pairFrequency[pairKey] || 0) + 1;
        }
      }
    });

    // Find frequent pairs (appearing in more than 20% of results)
    const frequentPairs = Object.entries(pairFrequency)
      .filter(([_, count]) => count >= pastResults.length * 0.2)
      .sort((a, b) => b[1] - a[1]);

    frequentPairs.slice(0, 5).forEach(([pair, count]) => {
      const confidence = count / pastResults.length;
      patterns.push({
        description: `Numbers ${pair} appear together frequently`,
        confidence
      });
    });

    // Check for numbers that haven't appeared recently
    const allNumbers = new Set(Array.from({ length: 49 }, (_, i) => i + 1));
    const recentResults = pastResults.slice(0, 10);
    const recentNumbers = new Set();

    recentResults.forEach(result => {
      result.numbers.split(',').map(n => parseInt(n.trim())).forEach(num => {
        recentNumbers.add(num);
      });
      recentNumbers.add(parseInt(result.bonus_number));
    });

    const missingNumbers = [...allNumbers].filter(num => !recentNumbers.has(num));

    if (missingNumbers.length > 0) {
      patterns.push({
        description: `Numbers ${missingNumbers.slice(0, 5).join(', ')} haven't appeared in the last 10 draws`,
        confidence: 0.5
      });
    }

    // Save patterns to database
    for (const pattern of patterns) {
      await dbHelper.run(
        'INSERT INTO detected_patterns (pattern_description, confidence) VALUES (?, ?)',
        [pattern.description, pattern.confidence]
      );
    }

    return { patterns };
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return { patterns: [] };
  }
};

export {
  randomPrediction,
  mlPrediction,
  neuralNetworkPrediction,
  savePrediction,
  calculateAccuracy,
  detectPatterns
};
