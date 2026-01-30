// bot.js - Telegram Bot для запуска Mini App
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-domain.com';

// Создаем бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram Bot запущен!');

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name;

    const welcomeMessage = `
👋 Привет, ${firstName}!

Добро пожаловать в **Fitness Pro** - твой персональный фитнес-помощник!

🏋️ Что умеет приложение:
• Отслеживание замеров и веса
• Планирование питания и подсчет КБЖУ
• Мониторинг состояния (сон, стресс, энергия)
• Программы тренировок с видео
• Чат с тренером

📱 Нажми на кнопку ниже, чтобы открыть приложение!
    `;

    const keyboard = {
        inline_keyboard: [[
            {
                text: '🚀 Открыть приложение',
                web_app: { url: WEB_APP_URL }
            }
        ]]
    };

    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Команда /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `
📖 **Помощь по использованию**

🔹 /start - Открыть приложение
🔹 /help - Показать эту справку
🔹 /stats - Статистика прогресса
🔹 /today - Сегодняшняя тренировка

💡 Для полного функционала используйте приложение через кнопку ниже:
    `;

    const keyboard = {
        inline_keyboard: [[
            {
                text: '🚀 Открыть приложение',
                web_app: { url: WEB_APP_URL }
            }
        ]]
    };

    bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Команда /stats - показать статистику
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
        // Здесь можно запросить статистику из базы данных
        const statsMessage = `
📊 **Твоя статистика**

🏋️ Тренировок за месяц: 12
📉 Изменение веса: -3 кг
🥗 Соблюдение питания: 85%
😴 Средний сон: 7.5 часов
💪 Прогресс: Отлично!

Подробности в приложении 👇
        `;

        const keyboard = {
            inline_keyboard: [[
                {
                    text: '📱 Открыть приложение',
                    web_app: { url: WEB_APP_URL }
                }
            ]]
        };

        bot.sendMessage(chatId, statsMessage, {
            parse_mode: 'Markdown',
            reply_markup: keyboard
        });
    } catch (error) {
        bot.sendMessage(chatId, '❌ Ошибка при получении статистики. Попробуйте позже.');
    }
});

// Команда /today - тренировка дня
bot.onText(/\/today/, (msg) => {
    const chatId = msg.chat.id;

    const todayMessage = `
📅 **Тренировка на сегодня**

💪 День 1: Верх тела
⏱️ Длительность: ~60 минут

Упражнения:
1️⃣ Жим штанги лежа - 4×12
2️⃣ Тяга верхнего блока - 3×15
3️⃣ Жим гантелей сидя - 3×12

Открой приложение для запуска тренировки 👇
    `;

    const keyboard = {
        inline_keyboard: [[
            {
                text: '▶️ Начать тренировку',
                web_app: { url: WEB_APP_URL }
            }
        ]]
    };

    bot.sendMessage(chatId, todayMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
    });
});

// Обработка данных из Web App
bot.on('web_app_data', (msg) => {
    const chatId = msg.chat.id;
    const data = JSON.parse(msg.web_app_data.data);

    console.log('Получены данные из Mini App:', data);

    // Обработка разных типов данных
    switch (data.type) {
        case 'workout_completed':
            bot.sendMessage(chatId, `
✅ Тренировка завершена!

Отличная работа! Ты завершил тренировку "${data.workoutName}".
Продолжай в том же духе! 💪
            `);
            break;

        case 'measurement_saved':
            bot.sendMessage(chatId, `
📏 Замер сохранен!

Вес: ${data.weight} кг
Продолжай отслеживать прогресс! 📈
            `);
            break;

        case 'message_to_trainer':
            bot.sendMessage(chatId, `
📤 Сообщение отправлено тренеру!

Тренер ответит в ближайшее время.
            `);
            break;

        default:
            bot.sendMessage(chatId, '✅ Данные получены!');
    }
});

// Обработка ошибок
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// Обработка неизвестных команд
bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, `
Я пока не понимаю обычные сообщения 😅

Используй команды:
/start - Открыть приложение
/help - Помощь
/stats - Статистика
/today - Тренировка дня

Или открой приложение:
    `, {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🚀 Открыть приложение',
                    web_app: { url: WEB_APP_URL }
                }
            ]]
        }
    });
});

module.exports = bot;
