const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        // Таблица пользователей
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                username VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                age INTEGER,
                gender VARCHAR(50),
                height DECIMAL,
                current_weight DECIMAL,
                target_weight DECIMAL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Таблица замеров
        await pool.query(`
            CREATE TABLE IF NOT EXISTS measurements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date TIMESTAMP DEFAULT NOW(),
                weight DECIMAL,
                chest DECIMAL,
                waist DECIMAL,
                hips DECIMAL,
                bicep_left DECIMAL,
                bicep_right DECIMAL,
                notes TEXT
            );
        `);

        // Таблица питания
        await pool.query(`
            CREATE TABLE IF NOT EXISTS nutrition (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date DATE DEFAULT CURRENT_DATE,
                water_consumed DECIMAL DEFAULT 0,
                water_goal DECIMAL DEFAULT 2.5,
                total_calories INTEGER,
                total_protein DECIMAL,
                total_fats DECIMAL,
                total_carbs DECIMAL
            );
        `);

        // Таблица приемов пищи
        await pool.query(`
            CREATE TABLE IF NOT EXISTS meals (
                id SERIAL PRIMARY KEY,
                nutrition_id INTEGER REFERENCES nutrition(id),
                meal_type VARCHAR(50),
                name VARCHAR(255),
                calories INTEGER,
                protein DECIMAL,
                fats DECIMAL,
                carbs DECIMAL,
                eaten BOOLEAN DEFAULT FALSE,
                eaten_at TIMESTAMP,
                photo_url TEXT,
                notes TEXT
            );
        `);

        // Таблица состояния
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conditions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date TIMESTAMP DEFAULT NOW(),
                sleep_duration DECIMAL,
                sleep_quality INTEGER,
                stress_level INTEGER,
                energy_physical INTEGER,
                energy_mental INTEGER,
                mood VARCHAR(50),
                pain_areas TEXT[]
            );
        `);

        // Таблица тренировок
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workouts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date TIMESTAMP DEFAULT NOW(),
                workout_name VARCHAR(255),
                duration INTEGER,
                completed BOOLEAN DEFAULT FALSE,
                rating INTEGER,
                notes TEXT
            );
        `);

        // Таблица упражнений
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exercises (
                id SERIAL PRIMARY KEY,
                workout_id INTEGER REFERENCES workouts(id),
                name VARCHAR(255),
                sets INTEGER,
                reps INTEGER,
                weight DECIMAL,
                completed BOOLEAN DEFAULT FALSE,
                feeling VARCHAR(50),
                notes TEXT
            );
        `);

        // Таблица сообщений
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                sender VARCHAR(50),
                message_type VARCHAR(50),
                content TEXT,
                file_url TEXT,
                timestamp TIMESTAMP DEFAULT NOW(),
                read BOOLEAN DEFAULT FALSE
            );
        `);

        console.log('✅ Все таблицы созданы успешно!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Ошибка создания таблиц:', error);
        process.exit(1);
    }
}

initDatabase();
```
