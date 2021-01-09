const { body, validationResult } = require('express-validator');

/**
 * Это функции валидаторы данных, передаваемых через Http body. Проверяют корректность данных о собачках.
 * Это middleware функции, которые мы добавляем в цепочку обработчика роута express. В документации
 * express про middleware подробно описано. Функции можно оборачивать в массив и потом этот массив
 * передавать в обработчик роута.
 */
const dogsValidator = [
    // middleware 1
    body('name').trim().isLength({ min: 2, max: 40 }).withMessage('Must be at least 2 chars long'),
    // middleware 2
    body('breed').trim().isLength({ min: 2, max: 40 }).withMessage('Must be at least 2 chars long'),
    // middleware 3
    body('age').isInt({min: 0, max: 50}).withMessage('Must be a correct number'),
    // middleware 4
    // Конструкция ниже явно задает тип функции как RequestHandler из express. Помогает при наборе
    // кода в VS Code. RequestHandler это и есть middleware функция.
    /** @type {import("express").RequestHandler} */
    (req, res, next) => {
        // Здесь проверяем, были ли ошибки валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // если были то отправляем назад объект с ошибками и кодом статуса Http 400
            res.status(400).json({ errors: errors.array() });
        } else next() // если ошибок нет, то переходим к следующему middleware. Валидация пройдена
    }
]

module.exports = dogsValidator