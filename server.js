// server.js - Backend для Fitness Mini App
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-app';
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ PostgreSQL connection error:', err);
    } else {
        console.log('✅ Connected to PostgreSQL');
    }
});

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + crypto.randomBytes(6).toString('hex') + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    username: String,
    firstName: String,
    lastName: String,
    trainerId: Number,
    profile: {
        age: Number,
        gender: String,
        height: Number,
        currentWeight: Number,
        targetWeight: Number,
        goal: String,
        level: String,
        equipment: [String]
    },
    createdAt: { type: Date, default: Date.now }
});

// Measurements Schema
const measurementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    date: { type: Date, default: Date.now },
    weight: Number,
    measurements: {
        chest: Number,
        waist: Number,
        hips: Number,
        bicepLeft: Number,
        bicepRight: Number,
        thighLeft: Number,
        thighRight: Number,
        calfLeft: Number,
        calfRight: Number
    },
    photos: [String],
    notes: String
});

// Nutrition Schema
const nutritionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    date: { type: Date, default: Date.now },
    meals: [{
        type: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
        name: String,
        ingredients: [String],
        calories: Number,
        protein: Number,
        fats: Number,
        carbs: Number,
        portion: String,
        recipe: String,
        eaten: { type: Boolean, default: false },
        eatenAt: Date,
        photo: String,
        notes: String
    }],
    water: {
        goal: { type: Number, default: 2.5 },
        consumed: { type: Number, default: 0 }
    },
    totalCalories: Number,
    totalProtein: Number,
    totalFats: Number,
    totalCarbs: Number
});

// Condition Schema
const conditionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    date: { type: Date, default: Date.now },
    sleep: {
        duration: Number, // in hours
        quality: Number, // 1-10
        bedTime: String,
        wakeTime: String
    },
    stress: {
        level: Number, // 1-10
        sources: [String],
        notes: String
    },
    energy: {
        physical: Number, // 1-10
        mental: Number // 1-10
    },
    mood: String,
    motivation: String, // low, medium, high
    pain: {
        areas: [String],
        severity: Number // 1-10
    },
    heartRate: Number,
    bloodPressure: String,
    menstrualCycle: {
        phase: String,
        symptoms: [String]
    }
});

// Workout Schema
const workoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    date: { type: Date, default: Date.now },
    programName: String,
    workoutName: String,
    duration: Number, // in minutes
    exercises: [{
        name: String,
        sets: Number,
        reps: Number,
        weight: Number,
        restTime: Number,
        videoUrl: String,
        description: String,
        completed: { type: Boolean, default: false },
        userVideo: String,
        feeling: String, // easy, normal, hard
        notes: String
    }],
    warmup: String,
    cooldown: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
    rating: Number, // 1-10
    notes: String
});

// Chat Message Schema
const messageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    trainerId: Number,
    sender: { type: String, enum: ['user', 'trainer'] },
    messageType: { type: String, enum: ['text', 'photo', 'video', 'voice', 'file'] },
    content: String,
    fileUrl: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

// Models
const User = mongoose.model('User', userSchema);
const Measurement = mongoose.model('Measurement', measurementSchema);
const Nutrition = mongoose.model('Nutrition', nutritionSchema);
const Condition = mongoose.model('Condition', conditionSchema);
const Workout = mongoose.model('Workout', workoutSchema);
const Message = mongoose.model('Message', messageSchema);

// ==================== AUTHENTICATION ====================

// Verify Telegram Data
function verifyTelegramWebAppData(telegramInitData) {
    // В продакшене здесь должна быть проверка подписи от Telegram
    // Для разработки просто парсим данные
    try {
        const params = new URLSearchParams(telegramInitData);
        const user = JSON.parse(params.get('user') || '{}');
        return user;
    } catch (error) {
        return null;
    }
}

// Middleware для проверки пользователя
async function authenticateUser(req, res, next) {
    const telegramId = req.headers['x-telegram-id'];
    
    if (!telegramId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        let user = await User.findOne({ telegramId: parseInt(telegramId) });
        
        if (!user) {
            // Создаем нового пользователя
            user = new User({
                telegramId: parseInt(telegramId),
                username: req.headers['x-telegram-username'],
                firstName: req.headers['x-telegram-firstname'],
                lastName: req.headers['x-telegram-lastname']
            });
            await user.save();
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// === USER ROUTES ===
app.get('/api/user', authenticateUser, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/user', authenticateUser, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === MEASUREMENTS ROUTES ===
app.get('/api/measurements', authenticateUser, async (req, res) => {
    try {
        const measurements = await Measurement.find({ 
            userId: req.user._id 
        }).sort({ date: -1 }).limit(30);
        res.json(measurements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/measurements', authenticateUser, upload.array('photos', 3), async (req, res) => {
    try {
        const measurementData = {
            userId: req.user._id,
            telegramId: req.user.telegramId,
            weight: req.body.weight,
            measurements: JSON.parse(req.body.measurements || '{}'),
            notes: req.body.notes,
            photos: req.files ? req.files.map(f => `/uploads/${f.filename}`) : []
        };

        const measurement = new Measurement(measurementData);
        await measurement.save();

        // Update user's current weight
        await User.findByIdAndUpdate(req.user._id, {
            'profile.currentWeight': req.body.weight
        });

        res.json(measurement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/measurements/latest', authenticateUser, async (req, res) => {
    try {
        const measurement = await Measurement.findOne({ 
            userId: req.user._id 
        }).sort({ date: -1 });
        res.json(measurement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === NUTRITION ROUTES ===
app.get('/api/nutrition', authenticateUser, async (req, res) => {
    try {
        const { date } = req.query;
        const query = { userId: req.user._id };
        
        if (date) {
            const targetDate = new Date(date);
            query.date = {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lt: new Date(targetDate.setHours(23, 59, 59, 999))
            };
        }
        
        const nutrition = await Nutrition.findOne(query);
        res.json(nutrition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/nutrition', authenticateUser, async (req, res) => {
    try {
        const nutritionData = {
            userId: req.user._id,
            telegramId: req.user.telegramId,
            ...req.body
        };

        const nutrition = new Nutrition(nutritionData);
        await nutrition.save();
        res.json(nutrition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/nutrition/:id/meal/:mealId', authenticateUser, upload.single('photo'), async (req, res) => {
    try {
        const nutrition = await Nutrition.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!nutrition) {
            return res.status(404).json({ error: 'Nutrition record not found' });
        }

        const meal = nutrition.meals.id(req.params.mealId);
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        meal.eaten = req.body.eaten === 'true';
        meal.eatenAt = new Date();
        meal.notes = req.body.notes;
        
        if (req.file) {
            meal.photo = `/uploads/${req.file.filename}`;
        }

        await nutrition.save();
        res.json(nutrition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/nutrition/:id/water', authenticateUser, async (req, res) => {
    try {
        const nutrition = await Nutrition.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $inc: { 'water.consumed': req.body.amount } },
            { new: true }
        );
        res.json(nutrition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === CONDITION ROUTES ===
app.get('/api/conditions', authenticateUser, async (req, res) => {
    try {
        const conditions = await Condition.find({ 
            userId: req.user._id 
        }).sort({ date: -1 }).limit(30);
        res.json(conditions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/conditions', authenticateUser, async (req, res) => {
    try {
        const conditionData = {
            userId: req.user._id,
            telegramId: req.user.telegramId,
            ...req.body
        };

        const condition = new Condition(conditionData);
        await condition.save();
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/conditions/latest', authenticateUser, async (req, res) => {
    try {
        const condition = await Condition.findOne({ 
            userId: req.user._id 
        }).sort({ date: -1 });
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === WORKOUT ROUTES ===
app.get('/api/workouts', authenticateUser, async (req, res) => {
    try {
        const workouts = await Workout.find({ 
            userId: req.user._id 
        }).sort({ date: -1 }).limit(30);
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/workouts', authenticateUser, async (req, res) => {
    try {
        const workoutData = {
            userId: req.user._id,
            telegramId: req.user.telegramId,
            ...req.body
        };

        const workout = new Workout(workoutData);
        await workout.save();
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/workouts/:id/exercise/:exerciseId', authenticateUser, upload.single('video'), async (req, res) => {
    try {
        const workout = await Workout.findOne({ 
            _id: req.params.id, 
            userId: req.user._id 
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        const exercise = workout.exercises.id(req.params.exerciseId);
        if (!exercise) {
            return res.status(404).json({ error: 'Exercise not found' });
        }

        exercise.completed = req.body.completed === 'true';
        exercise.feeling = req.body.feeling;
        exercise.notes = req.body.notes;
        
        if (req.file) {
            exercise.userVideo = `/uploads/${req.file.filename}`;
        }

        await workout.save();
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/workouts/:id/complete', authenticateUser, async (req, res) => {
    try {
        const workout = await Workout.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { 
                completed: true, 
                completedAt: new Date(),
                rating: req.body.rating,
                notes: req.body.notes
            },
            { new: true }
        );
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/workouts/today', authenticateUser, async (req, res) => {
    try {
        const today = new Date();
        const workout = await Workout.findOne({ 
            userId: req.user._id,
            date: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });
        res.json(workout);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === CHAT ROUTES ===
app.get('/api/messages', authenticateUser, async (req, res) => {
    try {
        const messages = await Message.find({ 
            telegramId: req.user.telegramId 
        }).sort({ timestamp: -1 }).limit(50);
        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/messages', authenticateUser, upload.single('file'), async (req, res) => {
    try {
        const messageData = {
            userId: req.user._id,
            telegramId: req.user.telegramId,
            trainerId: req.user.trainerId,
            sender: 'user',
            messageType: req.body.messageType || 'text',
            content: req.body.content
        };

        if (req.file) {
            messageData.fileUrl = `/uploads/${req.file.filename}`;
        }

        const message = new Message(messageData);
        await message.save();
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === STATISTICS ROUTES ===
app.get('/api/stats', authenticateUser, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [workoutCount, measurements, conditions] = await Promise.all([
            Workout.countDocuments({ 
                userId: req.user._id,
                completed: true,
                date: { $gte: thirtyDaysAgo }
            }),
            Measurement.find({ 
                userId: req.user._id 
            }).sort({ date: -1 }).limit(10),
            Condition.find({ 
                userId: req.user._id 
            }).sort({ date: -1 }).limit(10)
        ]);

        res.json({
            workoutCount,
            measurements,
            conditions,
            weightProgress: measurements.length > 1 ? 
                measurements[0].weight - measurements[measurements.length - 1].weight : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API: http://localhost:${PORT}/api`);
});

module.exports = app;
