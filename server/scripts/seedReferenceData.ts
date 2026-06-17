import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/db';
import { NutritionReference } from '../src/models/NutritionReference';
import { ExerciseReference } from '../src/models/ExerciseReference';

// CSV parser function
function parseCSV(content: string) {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  const records: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const record: any = {};
    headers.forEach((header, index) => {
      if (header) {
        record[header] = values[index] !== undefined ? values[index] : '';
      }
    });
    records.push(record);
  }
  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => v.trim().replace(/^"|"$/g, ''));
}

async function seedData() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully.');

    // 1. Seed Nutrition Reference Data
    console.log('Processing food nutrition datasets...');
    const foodDatasetDir = path.join(process.cwd(), '../FINAL FOOD DATASET');
    const foodFiles = [
      'FOOD-DATA-GROUP1.csv',
      'FOOD-DATA-GROUP2.csv',
      'FOOD-DATA-GROUP3.csv',
      'FOOD-DATA-GROUP4.csv',
      'FOOD-DATA-GROUP5.csv',
    ];

    let totalFoodsSeeded = 0;

    for (const filename of foodFiles) {
      const filePath = path.join(foodDatasetDir, filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      console.log(`Parsing ${filename}...`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parseCSV(fileContent);

      for (const record of records) {
        const name = record.food;
        if (!name) continue;

        const calories = parseFloat(record['Caloric Value']) || 0;
        const fat = parseFloat(record['Fat']) || 0;
        const protein = parseFloat(record['Protein']) || 0;
        const carbs = parseFloat(record['Carbohydrates']) || 0;
        const fiber = parseFloat(record['Dietary Fiber']) || 0;
        const sugar = parseFloat(record['Sugars']) || 0;
        const sodium = parseFloat(record['Sodium']) || 0;

        // Collect other fields into micronutrients map
        const micronutrients = new Map<string, number>();
        const coreKeys = ['food', 'Caloric Value', 'Fat', 'Protein', 'Carbohydrates', 'Dietary Fiber', 'Sugars', 'Sodium', 'Unnamed: 0', ''];
        Object.keys(record).forEach(key => {
          if (!coreKeys.includes(key)) {
            const val = parseFloat(record[key]);
            if (!isNaN(val)) {
              micronutrients.set(key, val);
            }
          }
        });

        // Idempotent upsert by name (case-insensitive key match)
        await NutritionReference.findOneAndUpdate(
          { name: name.toLowerCase() },
          {
            name: name,
            calories,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            sodium,
            servingSize: '100g',
            micronutrients,
          },
          { upsert: true, new: true }
        );
        totalFoodsSeeded++;
      }
    }
    console.log(`Successfully upserted ${totalFoodsSeeded} nutrition reference items.`);

    // 2. Seed Exercise Reference Data from wrkout/exercises.json
    console.log('Processing exercise reference dataset...');
    const exerciseDatasetFile = path.join(process.cwd(), 'scripts/wrkout-temp/exercises.json');

    if (!fs.existsSync(exerciseDatasetFile)) {
      console.error(`Exercise JSON file not found at: ${exerciseDatasetFile}`);
      process.exit(1);
    }

    // Clear old exercises to keep reference database consistent
    console.log('Clearing old exercise references...');
    await ExerciseReference.deleteMany({});

    // Muscle to body part category map for frontend compatibility
    const muscleToBodyPartMap: Record<string, string> = {
      'chest': 'chest',
      'lats': 'back',
      'middle back': 'back',
      'lower back': 'back',
      'trapezius': 'back',
      'traps': 'back',
      'shoulders': 'shoulders',
      'biceps': 'arms',
      'triceps': 'arms',
      'forearms': 'arms',
      'quadriceps': 'legs',
      'hamstrings': 'legs',
      'calves': 'legs',
      'glutes': 'legs',
      'adductors': 'legs',
      'abductors': 'legs',
      'abdominals': 'abs',
      'obliques': 'abs',
      'neck': 'neck',
      'cardio': 'cardio',
    };

    // Seed reference data
    const rawExercises = fs.readFileSync(exerciseDatasetFile, 'utf-8');
    const parsedData = JSON.parse(rawExercises);
    const exercisesList = Array.isArray(parsedData) ? parsedData : (parsedData.exercises || []);
    let totalExercisesSeeded = 0;

    for (const item of exercisesList) {
      if (!item.name) continue;

      const primaryMuscle = item.primaryMuscles?.[0]?.toLowerCase() || '';
      const bodyPart = muscleToBodyPartMap[primaryMuscle] || primaryMuscle || 'other';
      const equipment = item.equipment || '';
      const targetMuscle = item.primaryMuscles?.[0] || '';
      const instructions = Array.isArray(item.instructions) ? item.instructions.join('\n') : (item.instructions || '');

      await ExerciseReference.findOneAndUpdate(
        { name: item.name.toLowerCase() },
        {
          name: item.name,
          bodyPart,
          equipment,
          difficulty: item.level || 'medium',
          targetMuscle,
          instructions,
          gifUrl: undefined,
        },
        { upsert: true, new: true }
      );
      totalExercisesSeeded++;
    }

    console.log(`Successfully upserted ${totalExercisesSeeded} exercise reference items.`);
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding reference data:', error);
    process.exit(1);
  }
}

seedData();
